import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module.js';
import { ServicesModule } from './services/services.module.js';
import { PromosModule } from './promos/promos.module.js';

@Module({
  imports: [UsersModule, ServicesModule, PromosModule],
})
export class AdminModule {}