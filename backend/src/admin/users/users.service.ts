import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  ForbiddenException,
  Logger 
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { db } from '../../prisma/db.js';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  // 1. Fetch Staff & Admin Users
 // Temporary diagnostic fetcher - returns ALL users from Neon DB
  async getUsers(isArchived = false) {
    try {
      const allUsers: any[] = await db.orm.public.User.where({}).all();
      
      console.log('--- NEON DB FETCH DIAGNOSTIC ---');
      console.log(`Total rows returned from Neon: ${allUsers ? allUsers.length : 0}`);
      if (allUsers && allUsers.length > 0) {
        console.log('Sample Row 1:', allUsers[0]);
      }
      console.log('--------------------------------');

      if (!allUsers || allUsers.length === 0) {
        return [];
      }

      return allUsers.map((u) => ({
        id: u.id,
        firstName: u.firstName || u.first_name || '',
        lastName: u.lastName || u.last_name || '',
        fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
        email: u.email,
        role: String(u.role || 'STAFF').toUpperCase(),
        status: u.isActive || u.is_active ? 'ACTIVE' : 'INACTIVE',
        isActive: !!(u.isActive || u.is_active),
        isArchived: !!(u.archivedAt || u.archived_at),
        dateCreated: u.createdAt || u.created_at ? new Date(u.createdAt || u.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }) : 'N/A',
      }));
    } catch (error) {
      console.error('Error fetching users in service:', error);
      return [];
    }
  }

  // 2. Create User
  async createUser(dto: any) {
    const targetRole = String(dto.role || 'STAFF').toUpperCase();
    if (!['ADMIN', 'STAFF'].includes(targetRole)) {
      throw new BadRequestException('Role must be ADMIN or STAFF.');
    }

    const existing = await db.orm.public.User.where({ email: dto.email.toLowerCase().trim() }).first();
    if (existing) {
      throw new BadRequestException('A user with this email address already exists.');
    }

    const tempPassword = dto.tempPassword || Math.random().toString(36).slice(-8) + 'A1!';
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    return await db.orm.public.User.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: dto.email.toLowerCase().trim(),
      passwordHash: hashedPassword,
      role: targetRole,
      isActive: true,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // 3. Update User Profile
  async updateUser(id: number, dto: any) {
    const user = await db.orm.public.User.where({ id }).first();
    if (!user) throw new NotFoundException('User not found.');

    const updateData: any = { updatedAt: new Date().toISOString() };
    if (dto.firstName) updateData.firstName = dto.firstName.trim();
    if (dto.lastName) updateData.lastName = dto.lastName.trim();
    if (dto.email) updateData.email = dto.email.toLowerCase().trim();

    return await db.orm.public.User.where({ id }).update(updateData);
  }

  // 4. Update Role
  async updateUserRole(id: number, role: string) {
    const normalizedRole = role.toUpperCase();
    if (!['ADMIN', 'STAFF'].includes(normalizedRole)) {
      throw new BadRequestException('Allowed roles are ADMIN and STAFF.');
    }

    const user = await db.orm.public.User.where({ id }).first();
    if (!user) throw new NotFoundException('User not found.');

    return await db.orm.public.User.where({ id }).update({ 
      role: normalizedRole,
      updatedAt: new Date().toISOString()
    });
  }

  // 5. Toggle Status
  async toggleUserStatus(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot deactivate your own account.');
    }

    const user: any = await db.orm.public.User.where({ id }).first();
    if (!user) throw new NotFoundException('User not found.');

    return await db.orm.public.User.where({ id }).update({
      isActive: !user.isActive,
      updatedAt: new Date().toISOString()
    });
  }

  // 6. Toggle Archive
  async toggleUserArchive(id: number, currentUserId: number) {
    if (id === currentUserId) {
      throw new ForbiddenException('You cannot archive your own account.');
    }

    const user: any = await db.orm.public.User.where({ id }).first();
    if (!user) throw new NotFoundException('User not found.');

    const isCurrentlyArchived = !!(user.archivedAt ?? user.archived_at);

    return await db.orm.public.User.where({ id }).update({
      archivedAt: isCurrentlyArchived ? null : new Date().toISOString(),
      archivedBy: isCurrentlyArchived ? null : currentUserId,
      archiveReason: isCurrentlyArchived ? null : 'Archived via Admin Dashboard',
      updatedAt: new Date().toISOString(),
    });
  }
}