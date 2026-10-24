import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';
import { GuestBookingService } from './guest-booking.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, GuestBookingService],
})
export class AppointmentsModule {}