import { APP_GUARD } from '@nestjs/core';
import { MaintenanceAccessGuard } from './maintenance-access.guard.js';
import { PublicMaintenanceController } from './public-maintenance.controller.js';
import { SuperadminBackupDownloadController } from './superadmin-backup-download.controller.js';
import { SuperadminSettingsController } from './superadmin-settings.controller.js';
import { SuperadminSettingsService } from './superadmin-settings.service.js';
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
  controllers: [SuperadminOperationalLogsController, SuperadminController, SuperadminReportsController, SuperadminSettingsController, PublicMaintenanceController, SuperadminBackupDownloadController],
  providers: [
    SuperadminOperationalLogsService,
    SuperadminService,
    SuperadminReportsService,
    SuperadminSettingsService,
    MaintenanceAccessGuard,
    { provide: APP_GUARD, useExisting: MaintenanceAccessGuard },
    SuperadminUsersService,
    ManagementActionPinGuard,
    SuperadminGuard,
    AuditInterceptor,
    BackupService, 
  ],
})
export class SuperadminModule {}
