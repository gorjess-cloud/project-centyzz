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

  async getArchives(entity: string) {
    const allowedEntities = ['users', 'services', 'clients'];

    if (!allowedEntities.includes(entity)) {
      throw new BadRequestException(
        'Invalid entity. Allowed values: users, services, clients',
      );
    }

    const plan = db.raw.sql`
      SELECT
        id,
        "displayName",
        email,
        role,
        price,
        "archivedAt",
        "archivedBy",
        "archiveReason"
      FROM (
        SELECT
          id::text AS id,
          CONCAT("firstName", ' ', "lastName")::text
            AS "displayName",
          email::text AS email,
          role::text AS role,
          NULL::text AS price,
          archived_at::text AS "archivedAt",
          archived_by::text AS "archivedBy",
          archive_reason::text AS "archiveReason"
        FROM public."user"
        WHERE archived_at IS NOT NULL
          AND ${entity} = 'users'

        UNION ALL

        SELECT
          id::text AS id,
          name::text AS "displayName",
          NULL::text AS email,
          NULL::text AS role,
          price::text AS price,
          archived_at::text AS "archivedAt",
          archived_by::text AS "archivedBy",
          archive_reason::text AS "archiveReason"
        FROM public.services
        WHERE archived_at IS NOT NULL
          AND ${entity} = 'services'

        UNION ALL

        SELECT
          id::text AS id,
          full_name::text AS "displayName",
          email::text AS email,
          NULL::text AS role,
          NULL::text AS price,
          archived_at::text AS "archivedAt",
          archived_by::text AS "archivedBy",
          archive_reason::text AS "archiveReason"
        FROM public.clients
        WHERE archived_at IS NOT NULL
          AND ${entity} = 'clients'
      ) AS archived_records
      ORDER BY "archivedAt" DESC, id ASC
    `
      .returnsRow({
        id: 'pg/text@1',
        displayName: 'pg/text@1',
        email: {
          codecId: 'pg/text@1',
          nullable: true,
        },
        role: {
          codecId: 'pg/text@1',
          nullable: true,
        },
        price: {
          codecId: 'pg/text@1',
          nullable: true,
        },
        archivedAt: 'pg/text@1',
        archivedBy: {
          codecId: 'pg/text@1',
          nullable: true,
        },
        archiveReason: {
          codecId: 'pg/text@1',
          nullable: true,
        },
      })
      .build();

    const archives = await db.runtime().query(plan);

    return {
      success: true,
      message: 'Archived records retrieved successfully',
      entity,
      total: archives.length,
      data: archives,
    };
  }
  
  async checkUserPurgeEligibility(
    entity: string,
    idInput: string,
  ) {
    if (entity !== 'users') {
      throw new BadRequestException(
        'Purge check currently supports entity=users only',
      );
    }

    const id = Number(idInput);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new BadRequestException(
        'User ID must be a positive integer',
      );
    }

    // Confirm that the target account is archived.
    const userPlan = db.raw.sql`
      SELECT
        id,
        role::text AS role
      FROM public."user"
      WHERE id = ${id}
        AND archived_at IS NOT NULL
    `
      .returnsRow({
        id: 'pg/int4@1',
        role: 'pg/text@1',
      })
      .build();

    const [user] = await db.runtime().query(userPlan);

    if (!user) {
      throw new NotFoundException(
        'Archived user not found',
      );
    }

    // Check every user-reference foreign key
    // identified in the current database schema.
    const dependencyPlan = db.raw.sql`
      SELECT reference, total
      FROM (
        SELECT 'appointments.archived_by'::text AS reference, COUNT(*) AS total FROM public.appointments WHERE archived_by = ${id}
        UNION ALL
        SELECT 'appointments.user_id', COUNT(*) FROM public.appointments WHERE user_id = ${id}
        UNION ALL
        SELECT 'audit_logs.actor_id', COUNT(*) FROM public.audit_logs WHERE actor_id = ${id}
        UNION ALL
        SELECT 'backup_jobs.requested_by', COUNT(*) FROM public.backup_jobs WHERE requested_by = ${id}
        UNION ALL
        SELECT 'clients.archived_by', COUNT(*) FROM public.clients WHERE archived_by = ${id}
        UNION ALL
        SELECT 'clients.tier_overridden_by', COUNT(*) FROM public.clients WHERE tier_overridden_by = ${id}
        UNION ALL
        SELECT 'clients.user_id', COUNT(*) FROM public.clients WHERE user_id = ${id}
        UNION ALL
        SELECT 'inventory_movements.performed_by', COUNT(*) FROM public.inventory_movements WHERE performed_by = ${id}
        UNION ALL
        SELECT 'invoices.issued_by', COUNT(*) FROM public.invoices WHERE issued_by = ${id}
        UNION ALL
        SELECT 'membership_tiers.archived_by', COUNT(*) FROM public.membership_tiers WHERE archived_by = ${id}
        UNION ALL
        SELECT 'payments.received_by', COUNT(*) FROM public.payments WHERE received_by = ${id}
        UNION ALL
        SELECT 'products.archived_by', COUNT(*) FROM public.products WHERE archived_by = ${id}
        UNION ALL
        SELECT 'promos.archived_by', COUNT(*) FROM public.promos WHERE archived_by = ${id}
        UNION ALL
        SELECT 'service_categories.archived_by', COUNT(*) FROM public.service_categories WHERE archived_by = ${id}
        UNION ALL
        SELECT 'services.archived_by', COUNT(*) FROM public.services WHERE archived_by = ${id}
        UNION ALL
        SELECT 'staff.archived_by', COUNT(*) FROM public.staff WHERE archived_by = ${id}
        UNION ALL
        SELECT 'staff.user_id', COUNT(*) FROM public.staff WHERE user_id = ${id}
        UNION ALL
        SELECT 'staff_schedules.archived_by', COUNT(*) FROM public.staff_schedules WHERE archived_by = ${id}
        UNION ALL
        SELECT 'staff_schedules.assigned_by', COUNT(*) FROM public.staff_schedules WHERE assigned_by = ${id}
        UNION ALL
        SELECT 'system_settings.updated_by', COUNT(*) FROM public.system_settings WHERE updated_by = ${id}
        UNION ALL
        SELECT 'transaction_discounts.approved_by', COUNT(*) FROM public.transaction_discounts WHERE approved_by = ${id}
        UNION ALL
        SELECT 'transaction_discounts.removed_by', COUNT(*) FROM public.transaction_discounts WHERE removed_by = ${id}
        UNION ALL
        SELECT 'transaction_items.removed_by', COUNT(*) FROM public.transaction_items WHERE removed_by = ${id}
        UNION ALL
        SELECT 'transactions.archived_by', COUNT(*) FROM public.transactions WHERE archived_by = ${id}
        UNION ALL
        SELECT 'transactions.cashier_id', COUNT(*) FROM public.transactions WHERE cashier_id = ${id}
        UNION ALL
        SELECT 'transactions.voided_by', COUNT(*) FROM public.transactions WHERE voided_by = ${id}
        UNION ALL
        SELECT 'user.archived_by', COUNT(*) FROM public."user" WHERE archived_by = ${id}
        UNION ALL
        SELECT 'user_permissions.assigned_by', COUNT(*) FROM public.user_permissions WHERE assigned_by = ${id}
        UNION ALL
        SELECT 'user_permissions.user_id', COUNT(*) FROM public.user_permissions WHERE user_id = ${id}
      ) AS dependencies
      WHERE total > 0
      ORDER BY reference
    `
      .returnsRow({
        reference: 'pg/text@1',
        total: 'pg/int8@1',
      })
      .build();

    const rows = await db.runtime().query(dependencyPlan);

    const blockingReferences = rows.map((row) => ({
      reference: row.reference,
      total: Number(row.total),
    }));

    const hasBlockingReferences = blockingReferences.length > 0;

    return {
      success: true,
      message: 'Purge dependency check completed',
      data: {
        entity,
        id: String(user.id),
        role: user.role,
        isArchived: true,
        hasBlockingReferences,
        blockingReferences,
        databaseDependenciesClear: !hasBlockingReferences,
        readyToPurge: false,
        note: 'Permanent deletion remains disabled pending backup, retention, authorization, and transaction-time checks.',
      },
    };
  }
    
  async checkArchivePurgeEligibility(
    entity: string,
    id: string,
  ) {
    switch (entity) {
      case 'users':
        return this.checkUserPurgeEligibility(entity, id);

      case 'services':
        return this.checkServicePurgeEligibility(id);

      case 'clients':
        return this.checkClientPurgeEligibility(id);

      default:
        throw new BadRequestException(
          'Invalid entity. Allowed values: users, services, clients',
        );
    }
  }
  
  async checkServicePurgeEligibility(idInput: string) {
    const id = Number(idInput);

    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new BadRequestException(
        'Service ID must be a positive integer',
      );
    }

    const servicePlan = db.raw.sql`
      SELECT
        id,
        name::text AS name
      FROM public.services
      WHERE id = ${id}
        AND archived_at IS NOT NULL
    `
      .returnsRow({
        id: 'pg/int4@1',
        name: 'pg/text@1',
      })
      .build();

    const [service] = await db.runtime().query(servicePlan);

    if (!service) {
      throw new NotFoundException(
        'Archived service not found',
      );
    }

    const dependencyPlan = db.raw.sql`
      SELECT reference, total
      FROM (
        SELECT
          'appointments.service_id'::text AS reference,
          COUNT(*) AS total
        FROM public.appointments
        WHERE service_id = ${id}

        UNION ALL

        SELECT
          'transaction_items.service_id',
          COUNT(*)
        FROM public.transaction_items
        WHERE service_id = ${id}
      ) AS dependencies
      WHERE total > 0
      ORDER BY reference
    `
      .returnsRow({
        reference: 'pg/text@1',
        total: 'pg/int8@1',
      })
      .build();

    const rows = await db.runtime().query(dependencyPlan);

    const blockingReferences = rows.map((row) => ({
      reference: row.reference,
      total: Number(row.total),
    }));

    return {
      success: true,
      message: 'Purge dependency check completed',
      data: {
        entity: 'services',
        id: String(service.id),
        name: service.name,
        isArchived: true,
        hasBlockingReferences: blockingReferences.length > 0,
        blockingReferences,
        databaseDependenciesClear:
          blockingReferences.length === 0,
        readyToPurge: false,
        note: 'Permanent deletion remains disabled pending backup, retention, authorization, and transaction-time checks.',
      },
    };
  }


  async checkClientPurgeEligibility(idInput: string) {
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (typeof idInput !== 'string' || !uuidPattern.test(idInput)) {
      throw new BadRequestException(
        'Client ID must be a valid UUID',
      );
    }

    const clientPlan = db.raw.sql`
      SELECT
        id::text AS id,
        full_name::text AS name
      FROM public.clients
      WHERE id = ${idInput}::uuid
        AND archived_at IS NOT NULL
    `
      .returnsRow({
        id: 'pg/text@1',
        name: 'pg/text@1',
      })
      .build();

    const [client] = await db.runtime().query(clientPlan);

    if (!client) {
      throw new NotFoundException(
        'Archived client not found',
      );
    }

    const dependencyPlan = db.raw.sql`
      SELECT reference, total
      FROM (
        SELECT
          'appointments.client_id'::text AS reference,
          COUNT(*) AS total
        FROM public.appointments
        WHERE client_id = ${idInput}::uuid

        UNION ALL

        SELECT
          'transactions.client_id',
          COUNT(*)
        FROM public.transactions
        WHERE client_id = ${idInput}::uuid
      ) AS dependencies
      WHERE total > 0
      ORDER BY reference
    `
      .returnsRow({
        reference: 'pg/text@1',
        total: 'pg/int8@1',
      })
      .build();

    const rows = await db.runtime().query(dependencyPlan);

    const blockingReferences = rows.map((row) => ({
      reference: row.reference,
      total: Number(row.total),
    }));

    return {
      success: true,
      message: 'Purge dependency check completed',
      data: {
        entity: 'clients',
        id: client.id,
        name: client.name,
        isArchived: true,
        hasBlockingReferences: blockingReferences.length > 0,
        blockingReferences,
        databaseDependenciesClear: blockingReferences.length === 0,
        readyToPurge: false,
        note: 'Permanent deletion remains disabled pending backup, retention, authorization, and transaction-time checks.',
      },
    };
  }

  async getBackupJobs() {
    const plan = db.raw.sql`
      SELECT
        id::text AS id,
        requested_by::text AS "requestedBy",
        status::text AS status,
        storage_object_key AS "storageObjectKey",
        file_size_bytes::text AS "fileSizeBytes",
        error_message AS "errorMessage",
        requested_at::text AS "requestedAt",
        started_at::text AS "startedAt",
        completed_at::text AS "completedAt"
      FROM public.backup_jobs
      ORDER BY requested_at DESC, id DESC
      LIMIT 50
    `
      .returnsRow({
        id: 'pg/text@1',
        requestedBy: 'pg/text@1',
        status: 'pg/text@1',
        storageObjectKey: {
          codecId: 'pg/text@1',
          nullable: true,
        },
        fileSizeBytes: {
          codecId: 'pg/text@1',
          nullable: true,
        },
        errorMessage: {
          codecId: 'pg/text@1',
          nullable: true,
        },
        requestedAt: 'pg/text@1',
        startedAt: {
          codecId: 'pg/text@1',
          nullable: true,
        },
        completedAt: {
          codecId: 'pg/text@1',
          nullable: true,
        },
      })
      .build();

    const jobs = await db.runtime().query(plan);

    return {
      success: true,
      message: 'Backup jobs retrieved successfully',
      total: jobs.length,
      data: jobs,
    };
  }

}
