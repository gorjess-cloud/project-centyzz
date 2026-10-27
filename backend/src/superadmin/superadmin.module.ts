import { SuperadminOperationalLogsController } from './superadmin-operational-logs.controller.js';
import { SuperadminOperationalLogsService } from './superadmin-operational-logs.service.js';

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SuperadminController } from './superadmin.controller.js';
import { SuperadminReportsController } from './superadmin-reports.controller.js';
import { SuperadminReportsService } from './superadmin-reports.service.js';
import { SuperadminService } from './superadmin.service.js';
import { SuperadminUsersService } from './superadmin-users.service.js';
import { ManagementActionPinGuard } from '../auth/management-action-pin.guard.js';
import { SuperadminGuard } from './superadmin.guard.js';
import { AuditInterceptor } from '../audit/audit.interceptor.js';
import { BackupService } from '../backup/backup.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SuperadminOperationalLogsController, SuperadminController, SuperadminReportsController],
  providers: [
    SuperadminOperationalLogsService,
    SuperadminService,
    SuperadminReportsService,
    SuperadminUsersService,
    ManagementActionPinGuard,
    SuperadminGuard,
    AuditInterceptor,
    BackupService, 
  ],
})
export class SuperadminModule {}
