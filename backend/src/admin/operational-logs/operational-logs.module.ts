import { AdminOperationalEventInterceptor } from './admin-operational-event.interceptor.js';
import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import { OperationalLogsController } from './operational-logs.controller.js';
import { OperationalLogsService } from './operational-logs.service.js';

@Module({
  imports: [AuthModule],
  controllers: [OperationalLogsController],
  providers: [OperationalLogsService, AdminOperationalEventInterceptor],
  exports: [OperationalLogsService, AdminOperationalEventInterceptor],
})
export class OperationalLogsModule {}