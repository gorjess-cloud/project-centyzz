import { Controller, Get } from '@nestjs/common';
import { SuperadminSettingsService } from './superadmin-settings.service.js';

/** Public status contains no credentials or administrative details. */
@Controller('api/maintenance')
export class PublicMaintenanceController {
  constructor(private readonly settings: SuperadminSettingsService) {}

  @Get('status')
  async status() { return { success: true, data: await this.settings.getPublicMaintenance() }; }
}
