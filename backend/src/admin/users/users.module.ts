import { Module } from '@nestjs/common';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { AuthModule } from '../../auth/auth.module.js';
import { ManagementActionPinGuard } from './management-action-pin.guard.js';

@Module({
  controllers: [UsersController],
  providers: [UsersService, ManagementActionPinGuard],
  exports: [UsersService],
  imports: [AuthModule],
})
export class UsersModule {}