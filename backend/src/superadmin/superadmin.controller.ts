
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UseGuards,
  Query,
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
import { UseInterceptors } from '@nestjs/common';
import { AuditInterceptor } from '../audit/audit.interceptor.js';
import { AuditAction } from '../audit/audit-action.decorator.js';
import { ArchiveUserDto } from './dto/archive-user.dto.js';
import { UpdateServicePriceDto } from './dto/update-service-price.dto.js';

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

  @Patch('users/:id/role')
  @AuditAction('USER_ROLE_CHANGED', 'USER')
  @UseInterceptors(AuditInterceptor)
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

  @Get('logs')
  getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.superadminService.getAuditLogs(page, limit);
  }
  
  @Get('errors')
  getErrorLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.superadminService.getErrorLogs(
      page,
      limit,
    );
  }
  
  @Patch('users/:id/archive')
  archiveUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: ArchiveUserDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.superadminService.archiveUser(
      id,
      request.user.sub,
      body.reason,
    );
  }
  
  @Patch('services/:id/price')
  updateServicePrice(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateServicePriceDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.superadminService.updateServicePrice(
      id,
      body.price,
      request.user.sub,
    );
  }
  
  @Get('archives')
  getArchives(
    @Query('entity') entity: string,
  ) {
    return this.superadminService.getArchives(entity);
  }
  
  
  @Get('archives/purge-check')
  checkArchivePurge(
    @Query('entity') entity: string,
    @Query('id') id: string,
  ) {
    return this.superadminService.checkArchivePurgeEligibility(
      entity,
      id,
    );
  }
  
  @Get('settings/db-backups')
  getBackupJobs() {
    return this.superadminService.getBackupJobs();
  }

}
