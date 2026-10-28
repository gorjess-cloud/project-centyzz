import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { SuperadminGuard } from './superadmin.guard.js';
import { SuperadminReportsService } from './superadmin-reports.service.js';

/** Superadmin-exclusive reports routes. Never delegates to /api/admin/reports. */
@Controller('api/superadmin/reports')
@UseGuards(JwtAuthGuard, SuperadminGuard)
export class SuperadminReportsController {
  constructor(private readonly reports: SuperadminReportsService) {}

  @Get('pos')
  getPosReportData(@Query('date') date?: string) {
    const selectedDate = date || new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    return this.reports.getPosReportData(selectedDate);
  }

  @Get('closeouts')
  getSavedCloseoutReports() {
    return this.reports.getSavedCloseoutReports();
  }

  @Post('closeout')
  submitCloseout(@Body() dto: { reportDate: string; actualCash: number; cashier?: string }) {
    return this.reports.submitCloseout(dto);
  }

  @Delete('closeout/:id')
  deleteCloseoutReport(@Param('id', ParseIntPipe) id: number) {
    return this.reports.deleteCloseoutReport(id);
  }
}
