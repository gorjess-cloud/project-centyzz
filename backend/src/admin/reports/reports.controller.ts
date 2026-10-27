import { Controller, Get, Post, Delete, Query, Param, Body, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@Controller('api/admin/reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('pos')
  
  async getPosReportData(@Query('date') date?: string) {
    // If no date is passed, fallback to August 20, 2026
    const selectedDate = date || 'August 20, 2026';
    return this.reportsService.getPosReportData(selectedDate);
  }

  @Get('closeouts')
  async getSavedCloseoutReports() {
    return this.reportsService.getSavedCloseoutReports();
  }

  @Post('closeout')
  async submitCloseout(
    @Body() dto: { reportDate: string; actualCash: number },
  ) {
    return this.reportsService.submitCloseout(dto);
  }

  @Delete('closeout/:id')
  async deleteCloseoutReport(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.deleteCloseoutReport(id);
  }
}
