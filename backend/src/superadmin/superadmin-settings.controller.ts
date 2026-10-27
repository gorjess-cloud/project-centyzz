import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { ManagementActionPinGuard } from '../auth/management-action-pin.guard.js';
import { SuperadminGuard } from './superadmin.guard.js';
import { SuperadminSettingsService } from './superadmin-settings.service.js';
import type { MaintenanceUpdate } from './superadmin-settings.service.js';

/** Entirely Superadmin-specific: never uses an Admin controller or endpoint. */
@Controller('api/superadmin/settings')
@UseGuards(JwtAuthGuard, SuperadminGuard)
export class SuperadminSettingsController {
  constructor(private readonly settings: SuperadminSettingsService) {}

  @Get('maintenance')
  readMaintenance() { return this.settings.getMaintenance(); }

  @Patch('maintenance')
  @UseGuards(ManagementActionPinGuard)
  updateMaintenance(@Body() body: MaintenanceUpdate, @Req() req: AuthenticatedRequest) {
    return this.settings.saveMaintenance(body, req.user.sub);
  }
}
