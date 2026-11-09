import { EmailModule } from '../../email/email.module.js';
import { CredentialRecoveryService } from './credential-recovery.service.js';
import { CredentialRecoveryController } from './credential-recovery.controller.js';
import { OperationalLogsModule } from '../operational-logs/operational-logs.module.js';
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { AuthModule } from '../../auth/auth.module.js';
import { ManagementActionPinGuard } from './management-action-pin.guard.js';

@Module({
  controllers: [UsersController, CredentialRecoveryController],
  providers: [UsersService, ManagementActionPinGuard, CredentialRecoveryService],
  exports: [UsersService],
  imports: [AuthModule, OperationalLogsModule, EmailModule],
})
export class UsersModule {}