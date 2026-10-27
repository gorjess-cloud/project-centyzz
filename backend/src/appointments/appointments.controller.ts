import {
  Body,
  Headers,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  BadRequestException,
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
import { CreateAppointmentDto, CreateMemberStylistAppointmentDto } from './dto/create-appointment.dto.js';
import { GuestCheckoutDto, DemoFinishDto } from './dto/guest-booking.dto.js';
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
  async guestCheckout(@Body() booking: GuestCheckoutDto) {
    // Never trust Host/Origin supplied by a browser for payment callback URLs.
    const publicOrigin = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173';
    return this.guestBookings.createCheckout(booking, publicOrigin);
  }

  @Post('guest-demo/:id/complete')
  completeGuestDemo(@Param('id', ParseIntPipe) id: number, @Body() body: DemoFinishDto) {
    return this.guestBookings.completeDemo(id, body.token);
  }

  @Get('guest-checkout-status')
  guestCheckoutStatus(@Query('reference') reference: string, @Query('token') token: string) {
    return this.guestBookings.status(reference, token);
  }

  @Post('paymongo-webhook')
  @HttpCode(HttpStatus.OK)
  paymongoWebhook(@Req() request: import('express').Request & { rawBody?: Buffer },
    @Headers('paymongo-signature') signature?: string) {
    if (!request.rawBody) throw new BadRequestException('Raw webhook body unavailable');
    return this.guestBookings.paymongoWebhook(signature, request.rawBody, request.body);
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

  @Post('mine-stylist')
  @UseGuards(JwtAuthGuard)
  createMineWithStylist(
    @Body() appointment: CreateMemberStylistAppointmentDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.guestBookings.createMemberAppointment(
      appointment, request.user.sub, request.user.email,
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
