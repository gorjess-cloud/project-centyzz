
import { Injectable } from '@nestjs/common';
import { db } from '../prisma/db.js';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
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

  async getAuditLogs(
    pageInput = '1',
    limitInput = '10',
  ) {
    const page = Number(pageInput);
    const limit = Number(limitInput);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new BadRequestException(
        'Page must be a positive integer and limit must be between 1 and 100',
      );
    }

    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) {
      throw new BadRequestException('Page number is too large');
    }

    const countPlan = db.raw.sql`
      SELECT COUNT(*) AS total
      FROM public.audit_logs
      LIMIT 1
    `
      .returnsRow({
        total: 'pg/int8@1',
      })
      .build();

    const logsPlan = db.raw.sql`
      SELECT
        id::text AS id,
        actor_id::text AS "actorId",
        action,
        entity_type AS "entityType",
        entity_id AS "entityId",
        created_at::text AS "createdAt"
      FROM public.audit_logs
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
      .returnsRow({
        id: 'pg/text@1',
        actorId: { codecId: 'pg/text@1', nullable: true },
        action: 'pg/text@1',
        entityType: { codecId: 'pg/text@1', nullable: true },
        entityId: { codecId: 'pg/text@1', nullable: true },
        createdAt: 'pg/text@1',
      })
      .build();

    const [[count], logs] = await Promise.all([
      db.runtime().query(countPlan),
      db.runtime().query(logsPlan),
    ]);

    const total = Number(count.total);

    return {
      success: true,
      message: 'Audit logs retrieved successfully',
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getErrorLogs(
    pageInput = '1',
    limitInput = '10',
  ) {
    const page = Number(pageInput);
    const limit = Number(limitInput);

    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      throw new BadRequestException(
        'Page must be positive and limit must be between 1 and 100',
      );
    }

    const offset = (page - 1) * limit;

    if (!Number.isSafeInteger(offset)) {
      throw new BadRequestException('Page number is too large');
    }

    const countPlan = db.raw.sql`
      SELECT COUNT(*) AS total
      FROM public.error_logs
    `
      .returnsRow({
        total: 'pg/int8@1',
      })
      .build();

    const errorsPlan = db.raw.sql`
      SELECT
        id::text AS id,
        actor_id::text AS "actorId",
        error_name::text AS "errorName",
        error_message AS "errorMessage",
        stack_trace AS "stackTrace",
        http_method::text AS "httpMethod",
        request_path AS "requestPath",
        status_code AS "statusCode",
        created_at::text AS "createdAt"
      FROM public.error_logs
      ORDER BY created_at DESC, id DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
      .returnsRow({
        id: 'pg/text@1',
        actorId: {
          codecId: 'pg/text@1',
          nullable: true,
        },
        errorName: 'pg/text@1',
        errorMessage: 'pg/text@1',
        stackTrace: {
          codecId: 'pg/text@1',
          nullable: true,
        },
        httpMethod: {
          codecId: 'pg/text@1',
          nullable: true,
        },
        requestPath: {
          codecId: 'pg/text@1',
          nullable: true,
        },
        statusCode: 'pg/int4@1',
        createdAt: 'pg/text@1',
      })
      .build();

    const [[count], errors] = await Promise.all([
      db.runtime().query(countPlan),
      db.runtime().query(errorsPlan),
    ]);

    const total = Number(count.total);

    return {
      success: true,
      message: 'Error logs retrieved successfully',
      data: errors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  
  async archiveUser(
    targetUserId: number,
    actorUserId: number,
    reason: string,
  ) {
    if (
      typeof reason !== 'string' ||
      !reason.trim() ||
      reason.trim().length > 500
    ) {
      throw new BadRequestException(
        'Archive reason must contain 1 to 500 characters',
      );
    }

    if (targetUserId === actorUserId) {
      throw new ForbiddenException(
        'You cannot archive your own account',
      );
    }

    const targetUser = await db.orm.public.User
      .where({ id: targetUserId })
      .first();

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (targetUser.role === 'SUPERADMIN') {
      throw new ForbiddenException(
        'Superadmin accounts cannot be archived',
      );
    }

    const archiveReason = reason.trim();

    // Archive the user and record an audit event atomically.
    const plan = db.raw.sql`
      WITH archived AS (
        UPDATE public."user"
        SET
          "isActive" = FALSE,
          "updatedAt" = NOW(),
          archived_at = NOW(),
          archived_by = ${actorUserId},
          archive_reason = ${archiveReason}
        WHERE id = ${targetUserId}
          AND id <> ${actorUserId}
          AND role <> 'SUPERADMIN'
          AND archived_at IS NULL
        RETURNING id, email
      ),
      logged AS (
        INSERT INTO public.audit_logs (
          actor_id,
          action,
          entity_type,
          entity_id,
          new_values,
          reason
        )
        SELECT
          ${actorUserId},
          'USER_ARCHIVED',
          'USER',
          archived.id::text,
          jsonb_build_object(
            'isActive', false,
            'archived', true
          ),
          ${archiveReason}
        FROM archived
        RETURNING id
      )
      SELECT
        archived.id,
        archived.email::text AS email
      FROM archived
      INNER JOIN logged ON TRUE
    `
      .returnsRow({
        id: 'pg/int4@1',
        email: 'pg/text@1',
      })
      .build();

    const results = await db.runtime().query(plan);
    const archivedUser = results[0];

    if (!archivedUser) {
      throw new ConflictException(
        'User is already archived or was modified concurrently',
      );
    }

    return {
      success: true,
      message: 'User archived successfully',
      data: {
        id: archivedUser.id,
        email: archivedUser.email,
        isActive: false,
        isArchived: true,
        archivedBy: actorUserId,
      },
    };
  }
  async updateServicePrice(
    serviceId: number,
    newPrice: number,
    actorUserId: number,
  ) {
    // Validate price even if ValidationPipe isn't enabled.
    if (
      typeof newPrice !== 'number' ||
      !Number.isFinite(newPrice) ||
      newPrice <= 0 ||
      !/^\d+(\.\d{1,2})?$/.test(String(newPrice))
    ) {
      throw new BadRequestException(
        'Price must be greater than zero with at most 2 decimal places',
      );
    }

    // Check that the service exists and is not archived.
    const checkPlan = db.raw.sql`
      SELECT
        id,
        price::text AS price
      FROM public.services
      WHERE id = ${serviceId}
        AND archived_at IS NULL
    `
      .returnsRow({
        id: 'pg/int4@1',
        price: 'pg/text@1',
      })
      .build();

    const [service] = await db.runtime().query(checkPlan);

    if (!service) {
      throw new NotFoundException(
        'Service not found or archived',
      );
    }

    // Don't record an audit event if nothing changed.
    if (Number(service.price) === newPrice) {
      return {
        success: true,
        message: 'Service already has this price',
        data: {
          id: service.id,
          price: Number(service.price),
        },
      };
    }

    // Update service and insert audit event atomically.
    const plan = db.raw.sql`
      WITH current_service AS (
        SELECT id, price
        FROM public.services
        WHERE id = ${serviceId}
          AND archived_at IS NULL
        FOR UPDATE
      ),
      changed AS (
        UPDATE public.services AS s
        SET
          price = ${newPrice}::numeric,
          updated_at = NOW()
        FROM current_service AS old
        WHERE s.id = old.id
          AND old.price IS DISTINCT FROM ${newPrice}::numeric
        RETURNING
          s.id,
          old.price AS old_price,
          s.price AS new_price
      ),
      logged AS (
        INSERT INTO public.audit_logs (
          actor_id,
          action,
          entity_type,
          entity_id,
          old_values,
          new_values
        )
        SELECT
          ${actorUserId},
          'PRICE_CHANGED',
          'SERVICE',
          changed.id::text,
          jsonb_build_object('price', changed.old_price),
          jsonb_build_object('price', changed.new_price)
        FROM changed
        RETURNING id
      )
      SELECT
        changed.id,
        changed.old_price::text AS "oldPrice",
        changed.new_price::text AS "newPrice"
      FROM changed
      INNER JOIN logged ON TRUE
    `
      .returnsRow({
        id: 'pg/int4@1',
        oldPrice: 'pg/text@1',
        newPrice: 'pg/text@1',
      })
      .build();

    const [updated] = await db.runtime().query(plan);

    if (!updated) {
      throw new ConflictException(
        'Service price was not changed or the service was modified concurrently',
      );
    }

    return {
      success: true,
      message: 'Service price updated successfully',
      data: {
        id: updated.id,
        oldPrice: Number(updated.oldPrice),
        newPrice: Number(updated.newPrice),
        updatedBy: actorUserId,
      },
    };
  }

}
