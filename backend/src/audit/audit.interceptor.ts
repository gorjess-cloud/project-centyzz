
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

import { db } from '../prisma/db.js';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';

import {
  AUDIT_ACTION_KEY,
  type AuditActionMetadata,
} from './audit-action.decorator.js';

interface AuditedResponse {
  success?: boolean;
  message?: string;
  data?: {
    id?: number;
    role?: string;
  };
}

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {

    const metadata = this.reflector.get<AuditActionMetadata>(
      AUDIT_ACTION_KEY,
      context.getHandler(),
    );

    this.logger.log(
      `Audit action: ${metadata?.action ?? 'NONE'}`,
    );

    if (!metadata) {
      return next.handle();
    }

    const request =
      context.switchToHttp().getRequest<AuthenticatedRequest>();

    return next.handle().pipe(
      mergeMap(async (response: AuditedResponse) => {

        if (response?.success !== true) {
          this.logger.warn('Skipping: response not successful');
          return response;
        }

        if (
          metadata.action === 'USER_ROLE_CHANGED' &&
          response.message !== 'User role updated successfully'
        ) {
          this.logger.log('Skipping: no role change');
          return response;
        }

        const actorId = request.user?.sub;
        const entityId = response.data?.id;

        this.logger.log(
          `Actor ID: ${actorId}, Entity ID: ${entityId}`,
        );

        if (
          !Number.isInteger(actorId) ||
          !Number.isInteger(entityId)
        ) {
          this.logger.error(
            'Skipping: invalid actor or entity ID',
          );
          return response;
        }

        const newValues =
          metadata.action === 'USER_ROLE_CHANGED'
            ? { role: response.data?.role }
            : {};

        try {

          const plan = db.raw.sql`
            INSERT INTO public.audit_logs (
              actor_id,
              action,
              entity_type,
              entity_id,
              new_values
            )
            VALUES (
              ${actorId},
              ${metadata.action},
              ${metadata.entityType},
              ${String(entityId)},
              ${JSON.stringify(newValues)}::jsonb
            )
          `
            .affectedCount()
            .build();

          const result = await db.runtime().execute(plan);

          this.logger.log(
            `Audit INSERT affected rows: ${result.affectedRows}`,
          );
        } catch (error) {
          this.logger.error(
            'Failed to save audit log',
            error instanceof Error
              ? error.stack
              : String(error),
          );
        }

        return response;
      }),
    );
  }
}
