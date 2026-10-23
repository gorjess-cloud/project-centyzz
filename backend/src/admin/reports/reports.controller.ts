import { Controller, Get, Post, Delete, Query, Param, Body, ParseIntPipe } from '@nestjs/common';
import { ReportsService } from './reports.service.js';

@Controller('api/admin/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('pos')
  async getPosReportData(@Query('date') date?: string) {
    const selectedDate = date || 'August 20, 2026';
    return this.reportsService.getPosReportData(selectedDate);
  }

  @Get('closeouts')
  async getSavedCloseoutReports() {
    return this.reportsService.getSavedCloseoutReports();
  }

  @Post('closeout')
  async submitCloseout(@Body() dto: { reportDate: string; actualCash: number }) {
    return this.reportsService.submitCloseout(dto);
  }

  @Delete('closeout/:id')
  async deleteCloseoutReport(@Param('id', ParseIntPipe) id: number) {
    return this.reportsService.deleteCloseoutReport(id);
  }
}