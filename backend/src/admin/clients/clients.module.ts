import { OperationalLogsModule } from '../operational-logs/operational-logs.module.js';
import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller.js';
import { ClientsService } from './clients.service.js';
import { AuthModule } from '../../auth/auth.module.js';

@Module({
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
  imports: [AuthModule, OperationalLogsModule],
})
export class ClientsModule {}