import { Module } from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import { OperationalLogsModule } from '../operational-logs/operational-logs.module.js';
import { ManagementActionPinGuard } from '../../auth/management-action-pin.guard.js';
import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';

@Module({ imports: [AuthModule,OperationalLogsModule], controllers: [InventoryController], providers: [InventoryService,ManagementActionPinGuard] })
export class InventoryModule {}
