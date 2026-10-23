
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { SuperadminController } from './superadmin.controller.js';
import { SuperadminService } from './superadmin.service.js';
import { SuperadminGuard } from './superadmin.guard.js';
import { AuditInterceptor } from '../audit/audit.interceptor.js';
import { BackupService } from '../backup/backup.service.js';

@Module({
  imports: [AuthModule],
  controllers: [SuperadminController],
  providers: [
    SuperadminService,
    SuperadminGuard,
    AuditInterceptor,
    BackupService, 
  ],
})
export class SuperadminModule {}
