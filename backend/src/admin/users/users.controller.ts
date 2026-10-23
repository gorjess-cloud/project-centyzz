import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('api/admin/users')
//@UseGuards(JwtAuthGuard, RolesGuard) 
@Roles('ADMIN', 'SUPERADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

 @Get()
  
  async getUsers(@Query('archived') archived?: string) {
    const isArchived = archived === 'true';
    return this.usersService.getUsers(isArchived);
  }

  @Post()
  async createUser(@Body() dto: any) {
    return this.usersService.createUser(dto);
  }

  @Patch(':id')
  async updateUser(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.usersService.updateUser(id, dto);
  }

  @Patch(':id/role')
  @Roles('SUPERADMIN') // Strictly restricts role modifications to SUPERADMIN only
  async updateRole(@Param('id', ParseIntPipe) id: number, @Body('role') role: string) {
    return this.usersService.updateUserRole(id, role);
  }

  @Patch(':id/status')
  async toggleStatus(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.usersService.toggleUserStatus(id, req.user?.id);
  }

  @Patch(':id/archive')
  async toggleArchive(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    return this.usersService.toggleUserArchive(id, req.user?.id);
  }
}