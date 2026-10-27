import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { db } from '../prisma/db.js';
import { ManagementSecurityService, generateTemporaryPin, validPassword } from '../auth/management-security.service.js';
import { managementUserRecord } from '../management-users/user-record.js';

// This service implements Superadmin operations independently of the Admin controller.
// The shared formatter is the only common backend UI contract.
@Injectable()
export class SuperadminUsersService {
  constructor(private readonly security: ManagementSecurityService) {}

  async listUsers(isArchived: boolean) {
    const users = await db.orm.public.User.where({}).all();
    return users
      .filter((u) => ['SUPERADMIN', 'ADMIN', 'STAFF'].includes(String(u.role || '').toUpperCase().replace(/[\s_-]+/g, '')))
      .filter((u) => Boolean(u.archivedAt) === isArchived)
      .map(managementUserRecord);
  }

  async createUser(dto: any) {
    const role = String(dto?.role || 'STAFF').toUpperCase();
    if (!['ADMIN', 'STAFF'].includes(role)) throw new BadRequestException('Role must be ADMIN or STAFF. Superadmin provisioning is not available here.');
    const firstName = typeof dto?.firstName === 'string' ? dto.firstName.trim() : '';
    const lastName = typeof dto?.lastName === 'string' ? dto.lastName.trim() : '';
    const email = typeof dto?.email === 'string' ? dto.email.trim().toLowerCase() : '';
    if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('First name, last name and a valid email are required.');
    }
    if (await db.orm.public.User.where({ email }).first()) throw new ConflictException('Email already belongs to an account.');
    const configuredPassword = process.env.MANAGEMENT_DEFAULT_PASSWORD;
    if (configuredPassword && !validPassword(configuredPassword)) {
      throw new BadRequestException('Configured management default password does not meet policy.');
    }
    const temporaryPassword = configuredPassword || `Tmp!${randomBytes(12).toString('base64url')}9Aa`;
    const temporaryPin = generateTemporaryPin();
    const created = await db.orm.public.User.create({
      firstName, lastName, email, role, isActive: true, emailVerified: true,
      passwordHash: await bcrypt.hash(temporaryPassword, 12),
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    try {
      await this.security.provision(created.id, temporaryPin);
    } catch (error) {
      // Never leave an account usable without its management PIN.
      await this.security.pool.query('DELETE FROM public."user" WHERE id=$1', [created.id]).catch(() => {});
      throw error;
    }
    return {
      success: true, message: 'User created successfully', data: { id: created.id },
      id: created.id, firstName, lastName, email, role,
      temporaryPassword, temporaryPin, mustCompleteSetup: true,
    };
  }

  private async editableAccount(id: number) {
    const user = await db.orm.public.User.where({ id }).first();
    if (!user) throw new NotFoundException('Account not found.');
    if (String(user.role).toUpperCase() === 'SUPERADMIN') {
      throw new ForbiddenException('Superadmin accounts are protected; manage your own details in Account Settings.');
    }
    if (!['ADMIN', 'STAFF'].includes(String(user.role).toUpperCase())) {
      throw new ForbiddenException('This account cannot be managed from User Management.');
    }
    return user;
  }

  async editUser(id: number, dto: any) {
    await this.editableAccount(id);
    const firstName = typeof dto?.firstName === 'string' ? dto.firstName.trim() : '';
    const lastName = typeof dto?.lastName === 'string' ? dto.lastName.trim() : '';
    const email = typeof dto?.email === 'string' ? dto.email.toLowerCase().trim() : '';
    if (!firstName || !lastName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('First name, last name and a valid email are required.');
    }
    const duplicate = await db.orm.public.User.where({ email }).first();
    if (duplicate && duplicate.id !== id) throw new ConflictException('Email already belongs to an account.');
    await db.orm.public.User.where({ id }).update({ firstName, lastName, email, updatedAt: new Date().toISOString() });
    return { success: true, message: 'User updated successfully', data: { id }, id, updated: true };
  }

  async changeRole(id: number, role: string, actorId: number) {
    if (id === actorId) throw new ForbiddenException('You cannot change your own role.');
    const newRole = String(role || '').toUpperCase();
    if (!['ADMIN', 'STAFF'].includes(newRole)) throw new BadRequestException('Allowed roles are ADMIN and STAFF.');
    const user = await this.editableAccount(id);
    if (user.archivedAt) throw new BadRequestException('Restore the account before changing its role.');
    if (String(user.role).toUpperCase() === newRole) {
      return { success: true, message: 'User already has this role', data: { id, role: newRole } };
    }
    await db.orm.public.User.where({ id }).update({ role: newRole, updatedAt: new Date().toISOString() });
    return { success: true, message: 'User role updated successfully', data: { id, role: newRole }, id, role: newRole };
  }

  async toggleStatus(id: number, actorId: number) {
    if (id === actorId) throw new ForbiddenException('You cannot deactivate your own account.');
    const user = await this.editableAccount(id);
    if (user.archivedAt) throw new BadRequestException('Restore an archived account before changing its status.');
    const isActive = !user.isActive;
    await db.orm.public.User.where({ id }).update({ isActive, updatedAt: new Date().toISOString() });
    return { success: true, message: 'User status updated', data: { id, isActive }, id, isActive };
  }

  async toggleArchive(id: number, actorId: number) {
    if (id === actorId) throw new ForbiddenException('You cannot archive your own account.');
    const user = await this.editableAccount(id);
    const wasArchived = Boolean(user.archivedAt);
    await db.orm.public.User.where({ id }).update({
      archivedAt: wasArchived ? null : new Date().toISOString(),
      archivedBy: wasArchived ? null : actorId,
      archiveReason: wasArchived ? null : 'Archived via Superadmin User Management',
      isActive: wasArchived, // An archived account must not remain login-enabled.
      updatedAt: new Date().toISOString(),
    });
    return { success: true, message: wasArchived ? 'User restored' : 'User archived',
      data: { id, isArchived: !wasArchived }, id, isArchived: !wasArchived };
  }
}
