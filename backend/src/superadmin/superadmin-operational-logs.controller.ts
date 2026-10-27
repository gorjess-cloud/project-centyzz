import { Controller, Get, Header, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { ManagementActionPinGuard } from '../auth/management-action-pin.guard.js';
import { SuperadminGuard } from './superadmin.guard.js';
import { SuperadminOperationalLogsService } from './superadmin-operational-logs.service.js';

@Controller('api/superadmin/operational-logs')
@UseGuards(JwtAuthGuard, SuperadminGuard)
export class SuperadminOperationalLogsController {
  constructor(private readonly logs: SuperadminOperationalLogsService) {}

  @Get()
  list(@Query() filters: Record<string, string>) {
    return this.logs.list(filters);
  }

  @Get('export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="centyzz-operational-logs.csv"')
  export(@Query() filters: Record<string, string>) {
    return this.logs.exportCsv(filters);
  }

  @Patch(':source/:id/archive')
  @UseGuards(ManagementActionPinGuard)
  archive(@Param('source') source: string, @Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.logs.setArchived(source, id, true, request.user.sub);
  }

  @Patch(':source/:id/restore')
  @UseGuards(ManagementActionPinGuard)
  restore(@Param('source') source: string, @Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return this.logs.setArchived(source, id, false, request.user.sub);
  }
}
