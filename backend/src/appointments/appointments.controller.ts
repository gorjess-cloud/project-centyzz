import {
  Body,
  Controller,
  Get,
  GoneException,
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
import { GuestCheckoutDto } from './dto/guest-booking.dto.js';
import { GuestBookingService } from './guest-booking.service.js';

@Controller('api/appointments')
export class AppointmentsController {
  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly guestBookings: GuestBookingService,
  ) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  getMine(@Req() request: AuthenticatedRequest) {
    return this.appointmentsService.findMine(
      request.user.sub,
      request.user.email,
    );
  }

  @Get('stylists')
  getStylists() { return this.guestBookings.stylists(); }

  @Get('guest-availability')
  getGuestAvailability(
    @Query('date') date: string,
    @Query('service_id', ParseIntPipe) serviceId: number,
    @Query('stylist_id') stylistId: string,
  ) { return this.guestBookings.availableSlots(date, serviceId, stylistId); }

  @Post('guest-checkout')
  guestCheckout(@Body() booking: GuestCheckoutDto) {
    return this.guestBookings.createCheckout(booking);
  }

  // Prototype only: a token holder can confirm a simulated deposit in development.
  @Post('guest-demo/:id/complete')
  completeDemo(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { token?: string },
  ) { return this.guestBookings.completeDemo(id, body.token ?? ''); }

  @Get('guest-checkout-status')
  guestCheckoutStatus(@Query('reference') reference: string, @Query('token') token: string) {
    return this.guestBookings.status(reference, token);
  }

  @Post('guest-calendar')
  async guestCalendar(@Body() body: { reference?: string; token?: string }) {
    const id = await this.guestBookings.getGuestCalendarAppointmentId(body.reference ?? '', body.token ?? '');
    return this.appointmentsService.getCalendarLink(id);
  }

  @Get('staff')
  @UseGuards(JwtAuthGuard)
  getStaffAppointments(@Req() request: AuthenticatedRequest) {
    return this.guestBookings.listForStaff(request.user.sub, request.user.role);
  }

  @Patch(':id/staff-status')
  @UseGuards(JwtAuthGuard)
  updateStaffStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status?: string },
    @Req() request: AuthenticatedRequest,
  ) {
    return this.guestBookings.updateForStaff(id, body.status ?? '', request.user.sub, request.user.role);
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
  create() {
    // Public guest bookings must use the deposit-aware, stylist-aware flow.
    // Members continue to use POST /api/appointments/mine.
    throw new GoneException('For guest bookings use POST /api/appointments/guest-checkout');
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
