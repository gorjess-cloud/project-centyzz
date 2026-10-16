import {
  Body,
  Controller,
  Get,
  Post,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
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
  create(@Body() appointment: CreateAppointmentDto) {
    return this.appointmentsService.create(appointment);
  }
}