import { BadRequestException, ForbiddenException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../../email/email.service.js';
import { ManagementSecurityService, pinDigest, validPassword, validPin } from '../../auth/management-security.service.js';

export type RecoveryKind = 'password' | 'pin';
const fingerprint = (value: string) => createHash('sha256').update(value).digest('hex');
const invalidLink = () => new BadRequestException('This reset link is invalid, expired, or already used. Ask your administrator for a new email.');

export function recoveryOrigin() {
  const url = new URL(process.env.CREDENTIAL_RECOVERY_ORIGIN || 'http://localhost:5173');
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password ||
      url.pathname !== '/' || url.search || url.hash) throw new ServiceUnavailableException('Recovery website address is not configured correctly.');
  return url.origin;
}

@Injectable()
export class CredentialRecoveryService {
  private readonly logger = new Logger(CredentialRecoveryService.name);
  constructor(private readonly security: ManagementSecurityService, private readonly email: EmailService) {}

  async request(userId: number, kind: RecoveryKind, actorId: number) {
    if (!['password','pin'].includes(kind)) throw new BadRequestException('Unsupported recovery type');
    const origin = recoveryOrigin();
    const client = await this.security.pool.connect();
    try {
      await client.query('BEGIN');
      const actor = (await client.query('SELECT id, role, "isActive", archived_at FROM public."user" WHERE id=$1', [actorId])).rows[0];
      if (!actor || actor.role !== 'ADMIN' || !actor.isActive || actor.archived_at) throw new ForbiddenException('Admin access required');
      const user = (await client.query('SELECT * FROM public."user" WHERE id=$1 FOR UPDATE', [userId])).rows[0];
      if (!user || !['ADMIN','STAFF'].includes(user.role) || !user.isActive || user.archived_at) {
        throw new ForbiddenException('Reset emails are available only for active Admin and Staff accounts.');
      }
      const security = (await client.query('SELECT * FROM public.management_security WHERE user_id=$1 FOR UPDATE', [userId])).rows[0];
      if (!security || security.needs_setup) throw new BadRequestException('This account must complete first-time setup before using reset links.');
      const limits = (await client.query(`SELECT count(*)::int AS hourly,
        count(*) FILTER (WHERE created_at > now()-interval '1 minute')::int AS recent
        FROM public.admin_credential_recovery WHERE user_id=$1 AND created_at > now()-interval '1 hour'`, [userId])).rows[0];
      if (limits.recent > 0 || limits.hourly >= 5) throw new BadRequestException('Please wait before sending another reset email. Limit: one per minute and five per hour for this account.');
      const token = randomBytes(32).toString('base64url');
      const link = `${origin}/#/recover/${kind}?token=${token}`;
      const snapshot = fingerprint(kind === 'password' ? user.passwordHash : security.pin_hash);
      await client.query(`UPDATE public.admin_credential_recovery SET used_at=now()
        WHERE user_id=$1 AND kind=$2 AND used_at IS NULL`, [userId,kind]);
      await client.query(`INSERT INTO public.admin_credential_recovery
        (token_hash,user_id,issued_by,kind,email_snapshot,credential_snapshot) VALUES ($1,$2,$3,$4,$5,$6)`,
        [fingerprint(token),userId,actorId,kind,user.email,snapshot]);
      // No credentials change when an email is requested. Failed delivery rolls back the request.
      await this.email.sendCredentialResetLinkEmail(user.email,kind,link);
      await this.log(client, actorId, kind === 'password' ? 'Password Reset Email Sent' : 'PIN Reset Email Sent', `Reset email requested for account #${userId}`);
      await client.query('COMMIT');
      return { success: true, message: `${kind === 'password' ? 'Password' : 'PIN'} reset email sent. The link expires in 15 minutes.` };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof BadRequestException || error instanceof ForbiddenException) throw error;
      this.logger.error('Credential recovery email request failed');
      throw new ServiceUnavailableException('The reset email could not be sent. Please try again later.');
    } finally { client.release(); }
  }

  async complete(kind: RecoveryKind, token: string, newValue: string, confirmValue: string) {
    if (!['password','pin'].includes(kind) || typeof token !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw invalidLink();
    if (newValue !== confirmValue) throw new BadRequestException('The confirmation does not match.');
    if (kind === 'password' && (!validPassword(newValue) || newValue.length > 128)) throw new BadRequestException('Use 12–128 characters with upper/lowercase letters, a number and a symbol.');
    if (kind === 'pin' && !validPin(newValue)) throw new BadRequestException('Use six nontrivial digits. Avoid repeated digits and 123456 or 654321.');
    const client = await this.security.pool.connect();
    let recipient = '';
    try {
      await client.query('BEGIN');
      // Always lock the account before its token/security records for concurrent submissions.
      const lookup = (await client.query('SELECT user_id FROM public.admin_credential_recovery WHERE token_hash=$1 AND kind=$2', [fingerprint(token),kind])).rows[0];
      if (!lookup) throw invalidLink();
      const user = (await client.query('SELECT * FROM public."user" WHERE id=$1 FOR UPDATE',[lookup.user_id])).rows[0];
      const entry = (await client.query(`SELECT * FROM public.admin_credential_recovery
        WHERE token_hash=$1 AND kind=$2 AND used_at IS NULL AND expires_at > now() FOR UPDATE`,[fingerprint(token),kind])).rows[0];
      const security = (await client.query('SELECT * FROM public.management_security WHERE user_id=$1 FOR UPDATE',[lookup.user_id])).rows[0];
      if (!entry || !user || !security || !user.isActive || user.archived_at || security.needs_setup ||
          !['ADMIN','STAFF'].includes(user.role) || entry.email_snapshot !== user.email ||
          entry.credential_snapshot !== fingerprint(kind === 'password' ? user.passwordHash : security.pin_hash)) throw invalidLink();
      const previous = kind === 'password' ? user.passwordHash : security.pin_hash;
      const value = kind === 'password' ? newValue : pinDigest(newValue);
      if (await bcrypt.compare(value,previous)) throw new BadRequestException(`Choose a different ${kind === 'password' ? 'password' : 'PIN'} from your current one.`);
      const hash = await bcrypt.hash(value,12);
      if (kind === 'password') await client.query(`UPDATE public."user" SET "passwordHash"=$2,
        "otpHash"=NULL,"otpExpiresAt"=NULL,"otpAttempts"=0,"updatedAt"=now() WHERE id=$1`,[user.id,hash]);
      if (kind === 'pin') await client.query('UPDATE public.management_security SET pin_hash=$2 WHERE user_id=$1',[user.id,hash]);
      await client.query(`UPDATE public.management_security SET credential_version=credential_version+1,
        failed_attempts=0,locked_until=NULL,updated_at=now() WHERE user_id=$1`,[user.id]);
      await client.query('UPDATE public.admin_credential_recovery SET used_at=now() WHERE user_id=$1 AND used_at IS NULL',[user.id]);
      await this.log(client,user.id,kind === 'password' ? 'Password Reset' : 'PIN Reset','Credential changed through a single-use email link');
      await client.query('COMMIT');
      recipient=user.email;
    } catch (error) {
      await client.query('ROLLBACK');
      if (error instanceof BadRequestException) throw error;
      this.logger.error('Credential reset failed');
      throw new ServiceUnavailableException('Unable to reset this credential. Please try again later.');
    } finally { client.release(); }
    // Notification delivery cannot undo a committed change or cause a client to repeat it.
    try { await this.email.sendCredentialChangedEmail(recipient,kind); }
    catch { this.logger.error('Credential change notification could not be delivered'); }
    return {success:true,message:`Your ${kind === 'password' ? 'password' : 'PIN'} has been reset. Sign in again with your updated credentials.`};
  }

  private async log(client: any, actorId: number, event: string, details: string) {
    await client.query(`INSERT INTO public.operational_logs
      (module,event,actor_user_id,user_name,user_role,details,status)
      SELECT 'Authentication & Access',$2,id,
      COALESCE(NULLIF(btrim(concat_ws(' ',"firstName","lastName")),''),'User #'||id),role,$3,'Logged'
      FROM public."user" WHERE id=$1`,[actorId,event,details]);
  }
}
