import {
  Body,
  Controller,
  Get,
  Post,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';

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
  create(@Body() appointment: CreateAppointmentDto) {
    return this.appointmentsService.create(appointment);
  }
}