import { OperationalLogsModule } from '../operational-logs/operational-logs.module.js';
import { AuthModule } from '../../auth/auth.module.js';
import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller.js';
import { ServicesService } from './services.service.js';

@Module({
  imports: [AuthModule, OperationalLogsModule],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}