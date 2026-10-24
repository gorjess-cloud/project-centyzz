import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module.js';
import { ServicesModule } from './services/services.module.js';
import { PromosModule } from './promos/promos.module.js';
import { ClientsModule } from './clients/clients.module.js';
import { ReportsModule } from './reports/reports.module.js';

@Module({
  imports: [UsersModule, ServicesModule, PromosModule, ClientsModule, ReportsModule],
})
export class AdminModule {}