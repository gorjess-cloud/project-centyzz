import { WorkspaceModule } from './workspace/workspace.module.js';
import { ScheduleModule } from './schedule/schedule.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AdminSessionActivityInterceptor } from './operational-logs/admin-session-activity.interceptor.js';
import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module.js';
import { ServicesModule } from './services/services.module.js';
import { PromosModule } from './promos/promos.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { OperationalLogsModule } from './operational-logs/operational-logs.module.js';

@Module({
  providers: [{ provide: APP_INTERCEPTOR, useClass: AdminSessionActivityInterceptor }],
  imports: [WorkspaceModule, ScheduleModule, InventoryModule, UsersModule, ServicesModule, PromosModule, ClientsModule, ReportsModule, OperationalLogsModule],
})
export class AdminModule {}