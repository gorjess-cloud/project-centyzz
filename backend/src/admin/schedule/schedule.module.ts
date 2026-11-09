import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import { OperationalLogsModule } from '../operational-logs/operational-logs.module.js';
import { ManagementActionPinGuard } from '../../auth/management-action-pin.guard.js';
import { ScheduleController } from './schedule.controller.js';
import { ScheduleService } from './schedule.service.js';
@Module({imports:[AuthModule,OperationalLogsModule],controllers:[ScheduleController],providers:[ScheduleService,ManagementActionPinGuard]})
export class ScheduleModule {}
