
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { AppointmentsService } from './appointments.service.js';

@Controller('api/appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @Get('available-slots')
  getAvailableSlots(
    @Query('date') date: string,
    @Query('service_id', ParseIntPipe) serviceId: number,
  ) {
    return this.appointmentsService.getAvailableSlots(
      date,
      serviceId,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createAppointment(
    @Body()
    body: {
      serviceId?: number;
      appointmentDate?: string;
      startTime?: string;
      userId?: number | null;
      customerName?: string;
      customerEmail?: string;
      notes?: string | null;
    },
  ) {
    return this.appointmentsService.createAppointment(body);
  }

  @Get(':id/calendar')
  getCalendar(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.appointmentsService.getCalendarLink(id);
  }

  @Get(':id/calendar/ics')
  async downloadCalendar(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) response: Response,
  ) {
    const calendar =
      await this.appointmentsService.getCalendarFile(id);

    response.set({
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${calendar.filename}"`,
    });

    return new StreamableFile(
      Buffer.from(calendar.content, 'utf-8'),
    );
  }
}
