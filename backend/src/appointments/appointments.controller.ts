import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthenticatedRequest } from '../auth/jwt-auth.guard.js';
import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';

@Controller('api/appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
  ) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  getMine(@Req() request: AuthenticatedRequest) {
    return this.appointmentsService.findMine(
      request.user.sub,
      request.user.email,
    );
  }

  @Get('staff')
  @UseGuards(JwtAuthGuard)
  getStaffAppointments(@Req() request: AuthenticatedRequest) {
    return this.appointmentsService.findForStaff(request.user.role);
  }

  @Patch(':id/staff-status')
  @UseGuards(JwtAuthGuard)
  updateStaffStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status?: string },
    @Req() request: AuthenticatedRequest,
  ) {
    return this.appointmentsService.updateStatusForStaff(
      id,
      body.status ?? '',
      request.user.role,
    );
  }

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

  @Post('mine')
  @UseGuards(JwtAuthGuard)
  createMine(
    @Body() appointment: CreateAppointmentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.appointmentsService.createForUser(
      appointment,
      request.user.sub,
      request.user.email,
    );
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @Body() appointment: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(appointment);
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
