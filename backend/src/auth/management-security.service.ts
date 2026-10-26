import { BadRequestException, ForbiddenException, Injectable, OnModuleDestroy, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { createHmac, randomInt } from 'node:crypto';
import pg from 'pg';

export const MANAGEMENT_ROLES = ['SUPERADMIN', 'ADMIN', 'STAFF'];
export const isManagementRole = (role: string) => MANAGEMENT_ROLES.includes(String(role).toUpperCase().replace(/[\s_-]+/g, ''));
export const generateTemporaryPin = () => {
  let pin = '';
  do { pin = randomInt(100000, 1000000).toString(); } while (!validPin(pin));
  return pin;
};
export const validPin = (pin: unknown) => typeof pin === 'string' && /^\d{6}$/.test(pin)
  && !/^(\d)\1{5}$/.test(pin) && !['123456', '654321', '000000'].includes(pin);
// PINs are low-entropy; a server-side secret prevents offline PIN enumeration after a DB-only leak.
export const pinDigest = (pin: string) => {
  const pepper = process.env.MANAGEMENT_PIN_PEPPER;
  if (!pepper || pepper.length < 32) throw new Error('MANAGEMENT_PIN_PEPPER must be set to a random secret (32+ characters).');
  return createHmac('sha256', pepper).update(pin).digest('hex');
};
export const validPassword = (password: unknown) => typeof password === 'string' && password.length >= 12
  && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

export type SecurityRow = { user_id: number; pin_hash: string; needs_setup: boolean; failed_attempts: number; locked_until: Date | null; phone_number: string | null };

// Separate table keeps the existing Prisma 8 generated contract unchanged.
@Injectable()
export class ManagementSecurityService implements OnModuleDestroy {
  readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 4 });

  async onModuleDestroy() { await this.pool.end(); }

  async get(userId: number): Promise<SecurityRow | null> {
    const result = await this.pool.query<SecurityRow>(
      'SELECT * FROM public.management_security WHERE user_id = $1', [userId],
    );
    return result.rows[0] ?? null;
  }

  async requireConfigured(userId: number): Promise<SecurityRow> {
    const security = await this.get(userId);
    if (!security) throw new ForbiddenException('Management PIN has not been provisioned. Contact the administrator.');
    return security;
  }

  async provision(userId: number, pin: string) {
    if (!validPin(pin)) throw new BadRequestException('PIN must be six nontrivial digits');
    const hash = await bcrypt.hash(pinDigest(pin), 12);
    await this.pool.query(
      'INSERT INTO public.management_security (user_id, pin_hash, needs_setup) VALUES ($1, $2, TRUE)',
      [userId, hash],
    );
  }

  async verifyPin(userId: number, pin: string): Promise<SecurityRow> {
    // Lock the row during validation; concurrent bad attempts cannot evade the limit.
    const client = await this.pool.connect();
    let failed = false;
    let verified: SecurityRow | null = null;
    try {
      await client.query('BEGIN');
      const lookup = await client.query<SecurityRow>(
        'SELECT * FROM public.management_security WHERE user_id=$1 FOR UPDATE', [userId]);
      const security = lookup.rows[0];
      if (!security) throw new ForbiddenException('Management PIN is not provisioned. Contact the administrator.');
      if (security.locked_until && new Date(security.locked_until).getTime() > Date.now()) {
        throw new ForbiddenException('Too many attempts. Try again after 15 minutes.');
      }
      const matches = validPin(pin) && await bcrypt.compare(pinDigest(pin), security.pin_hash);
      if (!matches) {
        const attempts = (security.locked_until ? 0 : security.failed_attempts) + 1;
        await client.query(`UPDATE public.management_security SET failed_attempts=$2,
          locked_until = CASE WHEN $2 >= 5 THEN now() + interval '15 minutes' ELSE NULL END,
          updated_at=now() WHERE user_id=$1`, [userId, attempts]);
        failed = true;
      } else {
        await client.query(`UPDATE public.management_security SET failed_attempts=0,
          locked_until=NULL, updated_at=now() WHERE user_id=$1`, [userId]);
        verified = security;
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
    if (failed) throw new UnauthorizedException('Invalid management PIN');
    if (!verified) throw new UnauthorizedException('Invalid management PIN');
    return verified;
  }

  async finishSetup(userId: number, body: {
    firstName: string; lastName: string; phoneNumber: string; newPassword: string; newPin: string;
  }) {
    const firstName = String(body.firstName ?? '').trim();
    const lastName = String(body.lastName ?? '').trim();
    const phoneNumber = String(body.phoneNumber ?? '').trim();
    if (firstName.length < 2 || firstName.length > 100 || lastName.length < 2 || lastName.length > 100) {
      throw new BadRequestException('Enter your first and last name (2–100 characters each).');
    }
    if (!/^\+?[\d\s()-]{7,20}$/.test(phoneNumber)) throw new BadRequestException('Enter a valid phone number.');
    if (!validPassword(body.newPassword)) throw new BadRequestException('Use a new password with 12+ characters, upper/lowercase letters, a number and a symbol.');
    if (!validPin(body.newPin)) throw new BadRequestException('Use a nontrivial six-digit PIN.');

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const s = await client.query<SecurityRow>(
        'SELECT * FROM public.management_security WHERE user_id = $1 FOR UPDATE', [userId]);
      const security = s.rows[0];
      if (!security || !security.needs_setup) throw new ForbiddenException('First-time setup is not required for this account.');
      const old = await client.query<{ passwordHash: string; role: string; isActive: boolean; firstName: string; lastName: string }>(
        'SELECT "passwordHash", "firstName", "lastName", role, "isActive" FROM public."user" WHERE id = $1 FOR UPDATE', [userId]);
      const user = old.rows[0];
      if (!user || !user.isActive || !isManagementRole(user.role)) throw new ForbiddenException('Account unavailable');
      if (firstName.toLowerCase() === user.firstName.trim().toLowerCase() && lastName.toLowerCase() === user.lastName.trim().toLowerCase()) {
        throw new BadRequestException('Update your account name from the temporary profile provided by your administrator.');
      }
      if (await bcrypt.compare(body.newPassword, user.passwordHash)) throw new BadRequestException('Choose a different password from your temporary password.');
      if (await bcrypt.compare(pinDigest(body.newPin), security.pin_hash)) throw new BadRequestException('Choose a different PIN from your temporary PIN.');
      const hash = await bcrypt.hash(body.newPassword, 12);
      const pinHash = await bcrypt.hash(pinDigest(body.newPin), 12);
      await client.query(`UPDATE public."user" SET "firstName" = $2, "lastName" = $3,
        "passwordHash" = $4, "updatedAt" = now() WHERE id = $1`, [userId, firstName, lastName, hash]);
      await client.query(`UPDATE public.management_security SET pin_hash = $2, phone_number = $3,
        needs_setup = FALSE, failed_attempts = 0, locked_until = NULL, updated_at = now() WHERE user_id = $1`,
        [userId, pinHash, phoneNumber]);
      await client.query('COMMIT');
      return { firstName, lastName, phoneNumber };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async updatePhone(userId: number, phoneNumber: string) {
    await this.requireConfigured(userId);
    if (!/^\+?[\d\s()-]{7,20}$/.test(phoneNumber)) throw new BadRequestException('Enter a valid phone number');
    await this.pool.query('UPDATE public.management_security SET phone_number=$2, updated_at=now() WHERE user_id=$1', [userId, phoneNumber]);
  }

  async changeCredentials(userId: number, body: {
    currentPassword?: string; newPassword?: string; currentPin?: string; newPin?: string;
  }) {
    if (!body.newPassword && !body.newPin) throw new BadRequestException('No credential changes supplied');
    if (body.newPassword && !validPassword(body.newPassword)) throw new BadRequestException('Password must have 12+ characters, mixed case, number and symbol');
    if (body.newPin && !validPin(body.newPin)) throw new BadRequestException('PIN must contain six nontrivial digits');
    const security = await this.requireConfigured(userId);
    if (security.needs_setup) throw new ForbiddenException('Complete first-time setup first');
    const user = await this.pool.query<{ passwordHash: string }>('SELECT "passwordHash" FROM public."user" WHERE id = $1', [userId]);
    if (!user.rows[0]) throw new ForbiddenException('Account unavailable');
    if (body.newPassword && !(body.currentPassword && await bcrypt.compare(body.currentPassword, user.rows[0].passwordHash))) {
      throw new UnauthorizedException('Incorrect current password');
    }
    if (body.newPin) {
      await this.verifyPin(userId, String(body.currentPin || ''));
      if (await bcrypt.compare(pinDigest(body.newPin), security.pin_hash)) throw new BadRequestException('New PIN must differ from current PIN');
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      if (body.newPassword) await client.query('UPDATE public."user" SET "passwordHash"=$2, "updatedAt"=now() WHERE id=$1', [userId, await bcrypt.hash(body.newPassword, 12)]);
      if (body.newPin) await client.query('UPDATE public.management_security SET pin_hash=$2, updated_at=now() WHERE user_id=$1', [userId, await bcrypt.hash(pinDigest(body.newPin), 12)]);
      await client.query('COMMIT');
    } catch (error) { await client.query('ROLLBACK'); throw error; }
    finally { client.release(); }
    return { success: true, message: 'Credentials updated' };
  }
}
