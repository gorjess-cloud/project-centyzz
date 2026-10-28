import { CredentialRecoveryService } from './credential-recovery.service.js';
import { UseInterceptors } from '@nestjs/common';
import { AdminOperationalEventInterceptor } from '../operational-logs/admin-operational-event.interceptor.js';
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { ManagementActionPinGuard } from './management-action-pin.guard.js';

@UseInterceptors(AdminOperationalEventInterceptor)
@Controller('api/admin/users')
@UseGuards(JwtAuthGuard, RolesGuard) 
@Roles('ADMIN', 'SUPERADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService, private readonly recovery: CredentialRecoveryService) {}

  @Get('staff-job-roles')
  getStaffJobRoles() { return this.usersService.getStaffJobRoles(); }

 @Get()
  
  async getUsers(@Query('archived') archived?: string) {
    const isArchived = archived === 'true';
    return this.usersService.getUsers(isArchived);
  }

  @Post(':id/reset-password-email')
  @Roles('ADMIN')
  @UseGuards(ManagementActionPinGuard)
  sendPasswordReset(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.recovery.request(id, 'password', req.user.sub);
  }

  @Post(':id/reset-pin-email')
  @Roles('ADMIN')
  @UseGuards(ManagementActionPinGuard)
  sendPinReset(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.recovery.request(id, 'pin', req.user.sub);
  }

  @Post()
  @UseGuards(ManagementActionPinGuard)
  async createUser(@Body() dto: any) {
    return this.usersService.createUser(dto);
  }

  @Patch(':id')
  @UseGuards(ManagementActionPinGuard)
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.usersService.updateUser(id, dto);
  }

  @Patch(':id/role')
  @UseGuards(ManagementActionPinGuard)
  @Roles('SUPERADMIN') // Strictly restricts role modifications to SUPERADMIN only
  async updateRole(@Param('id', ParseIntPipe) id: number, @Body('role') role: string) {
    return this.usersService.updateUserRole(id, role);
  }

  @Patch(':id/status')
  @UseGuards(ManagementActionPinGuard)
  async toggleStatus(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.usersService.toggleUserStatus(id, req.user?.sub);
  }

  @Patch(':id/archive')
  @UseGuards(ManagementActionPinGuard)
  async toggleArchive(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.usersService.toggleUserArchive(id, req.user?.sub);
  }
}