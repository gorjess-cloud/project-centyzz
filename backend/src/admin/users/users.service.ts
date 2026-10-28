import { STAFF_JOB_ROLES, staffJobRole } from './staff-job-roles.js';
import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException,
  Logger 
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { ManagementSecurityService, generateTemporaryPin, validPassword } from '../../auth/management-security.service.js';
import { db } from '../../prisma/db.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(private readonly security: ManagementSecurityService) {}

  // 1. Fetch Staff & Admin Users
 // Retrieve account records without logging credentials or tokens
  async getUsers(isArchived = false) {
    try {
      const allUsers: any[] = await db.orm.public.User.where({}).all();
      
      if (!allUsers || allUsers.length === 0) {
        return [];
      }

      return allUsers.filter((u) => Boolean(u.archivedAt ?? u.archived_at) === isArchived).map((u) => ({
        id: u.id,
        firstName: u.firstName || u.first_name || '',
        lastName: u.lastName || u.last_name || '',
        fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email: u.email,
        role: String(u.role || 'STAFF').toUpperCase(),
        status: (u.isActive ?? u.is_active ?? false) ? 'ACTIVE' : 'INACTIVE',
        isActive: !!(u.isActive ?? u.is_active),
        isArchived: !!(u.archivedAt || u.archived_at),
        dateCreated: u.createdAt || u.created_at ? new Date(u.createdAt || u.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) : 'N/A',
      }));
    } catch (error) {
      this.logger.error('Error fetching users in service:', error);
      throw error;
    }
  }

  getStaffJobRoles() { return [...STAFF_JOB_ROLES]; }

  // 2. Create User
  async createUser(dto: any) {
    const targetRole = String(dto.role || 'STAFF').toUpperCase();
    if (!['ADMIN', 'STAFF'].includes(targetRole)) {
      throw new BadRequestException('Role must be ADMIN or STAFF.');
    }

    const jobRole = targetRole === 'STAFF' ? staffJobRole(dto.staffJobRole) : null;
    const firstName = typeof dto.firstName === 'string' ? dto.firstName.trim() : '';
    const lastName = typeof dto.lastName === 'string' ? dto.lastName.trim() : '';
    const email = typeof dto.email === 'string' ? dto.email.toLowerCase().trim() : '';
    if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('First name, last name and a valid email are required.');
    }
    const existing = await db.orm.public.User.where({ email }).first();
    if (existing) {
      throw new BadRequestException('A user with this email address already exists.');
    }

    // An explicitly configured initial password is allowed for onboarding only.
    // The creator still receives a unique temporary PIN for each account.
    // First login requires changing the password, PIN, name and phone number.
    const configuredPassword = process.env.MANAGEMENT_DEFAULT_PASSWORD;
    if (configuredPassword && !validPassword(configuredPassword)) {
      throw new BadRequestException('Configured management default password does not meet policy.');
    }
    const tempPassword = configuredPassword || `Tmp!${randomBytes(12).toString('base64url')}9Aa`;
    const tempPin = generateTemporaryPin();
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // Account, linked staff profile, assigned job role and PIN are one atomic onboarding action.
    const client=await this.security.pool.connect();
    let created:any;
    try {
      await client.query('BEGIN');
      created=(await client.query(`INSERT INTO public."user"("firstName","lastName",email,"passwordHash",role,"isActive","emailVerified","createdAt","updatedAt")
        VALUES($1,$2,$3,$4,$5,true,true,now(),now()) RETURNING id,email,"firstName","lastName"`,[firstName,lastName,email,hashedPassword,targetRole])).rows[0];
      if(jobRole) {
        // The database trigger also handles direct SQL and role changes; this explicit upsert
        // makes the selected job role part of the same account-creation transaction.
        await client.query(`INSERT INTO public.staff(user_id,employee_code,job_title) VALUES($1,$2,$3)
          ON CONFLICT(user_id) DO UPDATE SET job_title=excluded.job_title,updated_at=now()`,[created.id,'CNTZ-USER-'+created.id,jobRole]);
      }
      await this.security.provision(created.id,tempPin,client);
      await client.query('COMMIT');
    }catch(error:any){
      await client.query('ROLLBACK');
      if(error.code==='23505')throw new BadRequestException('A user with this email address already exists.');
      throw error;
    }finally{client.release();}
    return {
      id: created.id,
      email: created.email,
      role: targetRole,
      firstName: created.firstName,
      lastName: created.lastName,
      temporaryPassword: tempPassword,
      temporaryPin: tempPin,
      mustCompleteSetup: true,
      ...(jobRole ? {staffJobRole:jobRole} : {}),
    };
  }

  // 3. Update User Profile
  async updateUser(id: number, dto: any) {
    const user = await db.orm.public.User.where({ id }).first();
    if (!user) throw new NotFoundException('User not found.');

    const updateData: any = { updatedAt: new Date().toISOString() };
    if (dto.firstName) updateData.firstName = dto.firstName.trim();
    if (dto.lastName) updateData.lastName = dto.lastName.trim();
    if (dto.email) updateData.email = dto.email.toLowerCase().trim();

    if (String(user.role).toUpperCase() === 'SUPERADMIN') {
      throw new ForbiddenException('Superadmin accounts cannot be modified here.');
    }
    await db.orm.public.User.where({ id }).update(updateData);
    return { id, updated: true };
  }

  // 4. Update Role
  async updateUserRole(id: number, role: string) {
    const normalizedRole = role.toUpperCase();
    if (!['ADMIN', 'STAFF'].includes(normalizedRole)) {
      throw new BadRequestException('Allowed roles are ADMIN and STAFF.');
    }

    const user = await db.orm.public.User.where({ id }).first();
    if (!user) throw new NotFoundException('User not found.');
    if (String(user.role).toUpperCase() === 'SUPERADMIN') {
      throw new ForbiddenException('Superadmin accounts cannot be modified here.');
    }

    await db.orm.public.User.where({ id }).update({
      role: normalizedRole,
      updatedAt: new Date().toISOString(),
    });
    return { id, role: normalizedRole };
  }

  // 5. Toggle Status
  async toggleUserStatus(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot deactivate your own account.');
    }

    const user: any = await db.orm.public.User.where({ id }).first();
    if (!user) throw new NotFoundException('User not found.');
    if (String(user.role).toUpperCase() === 'SUPERADMIN') {
      throw new ForbiddenException('Superadmin accounts cannot be deactivated here.');
    }

    const isActive = !user.isActive;
    await db.orm.public.User.where({ id }).update({
      isActive,
      updatedAt: new Date().toISOString(),
    });
    return { id, isActive };
  }

  // 6. Toggle Archive
  async toggleUserArchive(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot archive your own account.');
    }

    const user: any = await db.orm.public.User.where({ id }).first();
    if (!user) throw new NotFoundException('User not found.');
    if (String(user.role).toUpperCase() === 'SUPERADMIN') {
      throw new ForbiddenException('Superadmin accounts cannot be archived here.');
    }

    const isCurrentlyArchived = !!(user.archivedAt ?? user.archived_at);

    await db.orm.public.User.where({ id }).update({
      archivedAt: isCurrentlyArchived ? null : new Date().toISOString(),
      archivedBy: isCurrentlyArchived ? null : currentUserId,
      archiveReason: isCurrentlyArchived ? null : 'Archived via Admin Dashboard',
      updatedAt: new Date().toISOString(),
    });
    return { id, isArchived: !isCurrentlyArchived };
  }
}