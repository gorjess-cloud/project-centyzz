
import { SetMetadata } from '@nestjs/common';

export const AUDIT_ACTION_KEY = 'audit_action';

export interface AuditActionMetadata {
  action: string;
  entityType: string;
}

export const AuditAction = (
  action: string,
  entityType: string,
) =>
  SetMetadata(AUDIT_ACTION_KEY, {
    action,
    entityType,
  } satisfies AuditActionMetadata);
