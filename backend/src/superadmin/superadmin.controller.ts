
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  JwtAuthGuard,
} from '../auth/jwt-auth.guard.js';

import type {
  AuthenticatedRequest,
} from '../auth/jwt-auth.guard.js';

import { SuperadminGuard } from './superadmin.guard.js';
import { SuperadminService } from './superadmin.service.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';

@Controller('api/superadmin')
@UseGuards(JwtAuthGuard, SuperadminGuard)
export class SuperadminController {
  constructor(
    private readonly superadminService: SuperadminService,
  ) {}

  // GET /api/superadmin/users
  @Get('users')
  getAllUsers() {
    return this.superadminService.getAllUsers();
  }

  // PATCH /api/superadmin/users/:id/role
  @Patch('users/:id/role')
  updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserRoleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.superadminService.updateUserRole(
      id,
      body.role,
      request.user.sub,
    );
  }
  
  @Get('dashboard/summary')
  getDashboardSummary() {
    return this.superadminService.getDashboardSummary();
  }

}
