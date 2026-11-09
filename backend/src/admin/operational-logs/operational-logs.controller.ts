import { Controller, Post, Logger, Get, Patch, Delete, Param, Query, Req, UseGuards, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { OperationalLogsService } from './operational-logs.service.js';

@Controller('api/admin/operational-logs')
@UseGuards(JwtAuthGuard)
export class OperationalLogsController {
  private readonly logger = new Logger(OperationalLogsController.name);
  constructor(private readonly service: OperationalLogsService) {}

  private requireManager(req: any) {
    const role = String(req.user?.role ?? '').toUpperCase();
    if (!['ADMIN', 'SUPERADMIN'].includes(role)) throw new ForbiddenException('Manager access required');
    return Number.isInteger(req.user?.sub) ? req.user.sub : null;
  }

  @Post('sign-out')
  async signOut(@Req() req: any) {
    if (!['ADMIN', 'STAFF'].includes(req.user?.role)) throw new ForbiddenException('Admin or Staff session required');
    try {
      const result = await this.service.recordSession(req.user.sub, 'Signed Out', req.headers.authorization.slice(7));
      return { success: true, ...result };
    } catch {
      this.logger.error('Admin/Staff sign-out recording failed');
      return { success: true, recorded: false };
    }
  }

  @Get()
  list(@Req() req: any, @Query('archived') archived?: string) {
    this.requireManager(req);
    return this.service.list(archived === 'true', req.user.role === 'ADMIN');
  }

  @Patch(':id/archive')
  archive(@Req() req: any, @Param('id') id: string) {
    const actorId = this.requireManager(req);
    return this.service.archive(id, actorId, req.user.role === 'ADMIN');
  }

  @Patch(':id/restore')
  restore(@Req() req: any, @Param('id') id: string) {
    this.requireManager(req);
    return this.service.restore(id, req.user.role === 'ADMIN');
  }

  @Delete(':id')
  hide(@Req() req: any, @Param('id') id: string) {
    const actorId = this.requireManager(req);
    return this.service.hide(id, actorId, req.user.role === 'ADMIN');
  }
}
