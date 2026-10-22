
import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class SuperadminService {
  async getAllUsers() {
    const users = await db.orm.public.User.all();

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: users.map((user) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
    };
  }
  
  async getDashboardSummary() {
    const plan = db.raw.sql`
      SELECT
        (
          SELECT COUNT(*)
          FROM public."user"
        ) AS "totalUsers",

        (
          SELECT COUNT(*)
          FROM public."user"
          WHERE role = 'SUPERADMIN'
            AND "isActive" = TRUE
            AND archived_at IS NULL
        ) AS "activeSuperadmins",

        (
          SELECT COUNT(*)
          FROM public."user"
          WHERE role = 'ADMIN'
            AND "isActive" = TRUE
            AND archived_at IS NULL
        ) AS "activeAdmins",

        (
          SELECT COUNT(*)
          FROM public."user"
          WHERE role = 'STAFF'
            AND "isActive" = TRUE
            AND archived_at IS NULL
        ) AS "activeStaff",

        (
          SELECT COUNT(*)
          FROM public."user"
          WHERE role = 'CUSTOMER'
            AND "isActive" = TRUE
            AND archived_at IS NULL
        ) AS "activeClients",

        (
          SELECT COALESCE(SUM(grand_total), 0)
          FROM public.transactions
          WHERE status = 'COMPLETED'
            AND completed_at IS NOT NULL
            AND voided_at IS NULL
            AND archived_at IS NULL
        ) AS "totalRevenue"
    `
      .returnsRow({
        totalUsers: 'pg/int8@1',
        activeSuperadmins: 'pg/int8@1',
        activeAdmins: 'pg/int8@1',
        activeStaff: 'pg/int8@1',
        activeClients: 'pg/int8@1',
        totalRevenue: 'pg/numeric@1',
      })
      .build();

    const [summary] = await db.runtime().query(plan);

    return {
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: {
        totalUsers: Number(summary.totalUsers),
        activeSuperadmins: Number(summary.activeSuperadmins),
        activeAdmins: Number(summary.activeAdmins),
        activeStaff: Number(summary.activeStaff),
        activeClients: Number(summary.activeClients),
        totalRevenue: Number(summary.totalRevenue),
        currency: 'PHP',
      },
    };
  }
  
  async updateUserRole(
    targetUserId: number,
    newRole: string,
    actorUserId: number,
  ) {
    const allowedRoles = [
      'SUPERADMIN',
      'ADMIN',
      'STAFF',
      'CUSTOMER',
    ];

    if (!allowedRoles.includes(newRole)) {
      throw new BadRequestException('Invalid user role');
    }

    if (targetUserId === actorUserId) {
      throw new ForbiddenException(
        'You cannot change your own role',
      );
    }

    const targetUser = await db.orm.public.User
      .where({ id: targetUserId })
      .first();

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.role === newRole) {
      return {
        success: true,
        message: 'User already has this role',
        data: {
          id: targetUser.id,
          email: targetUser.email,
          role: targetUser.role,
        },
      };
    }

    await db.orm.public.User
      .where({ id: targetUserId })
      .update({ role: newRole });

    const updatedUser = await db.orm.public.User
      .where({ id: targetUserId })
      .first();

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      message: 'User role updated successfully',
      data: {
        id: updatedUser.id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    };
  }

}
