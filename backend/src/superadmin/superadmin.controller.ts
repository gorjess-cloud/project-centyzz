
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
  Post,
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
import { UpdateServicePriceDto } from './dto/update-service-price.dto.js';
import { BackupService } from '../backup/backup.service.js';
import { SuperadminUsersService } from './superadmin-users.service.js';
import { ManagementActionPinGuard } from '../auth/management-action-pin.guard.js';

@Controller('api/superadmin')
@UseGuards(JwtAuthGuard, SuperadminGuard)
export class SuperadminController {
  constructor(
    private readonly superadminService: SuperadminService,
    private readonly superadminUsers: SuperadminUsersService,
    private readonly backupService: BackupService,
  ) {}

  // Independent Superadmin User Management API (never forwards to /api/admin/users).
  @Get('users')
  getAllUsers(@Query('archived') archived?: string) {
    return this.superadminUsers.listUsers(archived === 'true');
  }

  @Post('users')
  @UseGuards(ManagementActionPinGuard)
  @AuditAction('USER_CREATED', 'USER')
  @UseInterceptors(AuditInterceptor)
  createUser(@Body() dto: any) {
    return this.superadminUsers.createUser(dto);
  }

  @Patch('users/:id')
  @UseGuards(ManagementActionPinGuard)
  @AuditAction('USER_UPDATED', 'USER')
  @UseInterceptors(AuditInterceptor)
  editUser(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.superadminUsers.editUser(id, dto);
  }

  @Patch('users/:id/role')
  @UseGuards(ManagementActionPinGuard)
  @AuditAction('USER_ROLE_CHANGED', 'USER')
  @UseInterceptors(AuditInterceptor)
  updateUserRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateUserRoleDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.superadminUsers.changeRole(id, body.role, request.user.sub);
  }

  @Patch('users/:id/status')
  @UseGuards(ManagementActionPinGuard)
  @AuditAction('USER_STATUS_CHANGED', 'USER')
  @UseInterceptors(AuditInterceptor)
  toggleUserStatus(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.superadminUsers.toggleStatus(id, request.user.sub);
  }

  @Patch('users/:id/archive')
  @UseGuards(ManagementActionPinGuard)
  @AuditAction('USER_ARCHIVE_TOGGLED', 'USER')
  @UseInterceptors(AuditInterceptor)
  toggleUserArchive(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.superadminUsers.toggleArchive(id, request.user.sub);
  }

  @Get('dashboard/summary')
  getDashboardSummary() {
    return this.superadminService.getDashboardSummary();
  }

  @Get('logs')
  getAuditLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('action') action?: string,
  ) {
    return this.superadminService.getAuditLogs(page, limit, search, action);
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
  
  @Post('settings/db-backup')
  @UseGuards(ManagementActionPinGuard)
  createDatabaseBackup(
    @Req() request: AuthenticatedRequest,
  ) {
    return this.backupService.createBackup(
      request.user.sub,
    );
  }

}
