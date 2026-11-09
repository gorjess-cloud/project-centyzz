import { OperationalLogsModule } from '../operational-logs/operational-logs.module.js';
import { AuthModule } from '../../auth/auth.module.js';
import { Module } from '@nestjs/common';
import { PromosController } from './promos.controller.js';
import { PromosService } from './promos.service.js';

@Module({
  imports: [AuthModule, OperationalLogsModule],
  controllers: [PromosController],
  providers: [PromosService],
  exports: [PromosService],
})
export class PromosModule {}