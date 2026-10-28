import { Optional } from '@nestjs/common';
import { SalonConfigService,defaultBookingDay } from '../salon/salon-config.service.js';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import type { Varchar } from '@prisma/orm-postgres/target/codec-types';
import type { CreateAppointmentDto } from './dto/create-appointment.dto.js';

interface CreateAppointmentInput {
  serviceId?: number;
  appointmentDate?: string;
  startTime?: string;
  userId?: number | null;
  customerName?: string;
  customerEmail?: string;
  notes?: string | null;
}

@Injectable()
export class AppointmentsService {
  constructor(@Optional() private readonly salon?:SalonConfigService) {}
  private operatingDay(date:string){return this.salon?this.salon.bookingDay(date):Promise.resolve(defaultBookingDay());}
  private readonly logger = new Logger(AppointmentsService.name);

  async findForStaff(role: string) {
    this.assertStaffRole(role);
    try {
      const appointments = await db.orm.public.Appointment.where({}).all();
      const services = await db.orm.public.Service.where({}).all();
      const data = await Promise.all(appointments.map(async (appointment) => {
        const service = services.find((item) => item.id === appointment.serviceId);
        return {
          ...appointment,
          service: service ? {
            id: service.id,
            name: service.name,
            price: Number(service.price),
            durationMinutes: service.durationMinutes,
          } : null,
        };
      }));
      data.sort((a, b) => `${a.appointmentDate} ${a.startTime}`.localeCompare(`${b.appointmentDate} ${b.startTime}`));
      return { success: true, data };
    } catch (error) {
      this.logger.error('Failed to fetch staff appointments', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Unable to retrieve appointments');
    }
  }

  async updateStatusForStaff(id: number, status: string, role: string) {
    this.assertStaffRole(role);
    const normalizedStatus = status.trim().toUpperCase();
    if (!['CONFIRMED', 'NO_SHOW'].includes(normalizedStatus)) {
      throw new BadRequestException('Status must be CONFIRMED or NO_SHOW');
    }
    const appointment = await db.orm.public.Appointment.where({ id }).first();
    if (!appointment) throw new NotFoundException('Appointment not found');
    const updated = await db.orm.public.Appointment.where({ id }).update({ status: normalizedStatus as Varchar<30> });
    return { success: true, data: updated };
  }

  private assertStaffRole(role: string) {
    if (!['STAFF', 'ADMIN', 'SUPERADMIN'].includes((role || '').toUpperCase())) {
      throw new ForbiddenException('Staff access required');
    }
  }

  async createForUser(
    input: CreateAppointmentDto,
    userId: number,
    email: string,
  ) {
    const user = await db.orm.public.User.where({
      id: userId,
      email: email as Varchar<255>,
    }).first();

    if (!user || !user.isActive || !user.emailVerified) {
      throw new UnauthorizedException('An active verified account is required');
    }

    return this.create({
      ...input,
      customerName: `${user.firstName} ${user.lastName}`.trim() as Varchar<150>,
      customerEmail: user.email,
    }, user.id);
  }

  async findMine(userId: number, email: string) {
    try {
      const [userAppointments, emailAppointments] = await Promise.all([
        db.orm.public.Appointment.where({ userId }).all(),
        db.orm.public.Appointment.where({
          customerEmail: email.toLowerCase() as Varchar<255>,
        }).all(),
      ]);
      const appointments = Array.from(
        new Map(
          [...userAppointments, ...emailAppointments].map((appointment) => [
            appointment.id,
            appointment,
          ]),
        ).values(),
      ).sort((first, second) =>
        `${first.appointmentDate} ${first.startTime}`.localeCompare(
          `${second.appointmentDate} ${second.startTime}`,
        ),
      );

      const data = await Promise.all(
        appointments.map(async (appointment) => {
          const service = await db.orm.public.Service.where({
            id: appointment.serviceId,
          }).first();

          return {
            ...appointment,
            service: service
              ? {
                  id: service.id,
                  name: service.name,
                  price: Number(service.price),
                  durationMinutes: service.durationMinutes,
                }
              : null,
          };
        }),
      );

      return { success: true, data };
    } catch (error) {
      this.logger.error(
        'Failed to fetch member appointments',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException(
        'Unable to retrieve your appointments',
      );
    }
  }

  async create(input: CreateAppointmentDto, userId?: number) {
    const { appointmentDate, customerEmail, customerName, serviceId, startTime } = input;
    this.validateDate(appointmentDate);

    const startMinutes = this.timeToMinutes(startTime);
    const operating=await this.operatingDay(appointmentDate);

    try {
      const salonNow = this.salonDateTime();
      if (
        appointmentDate === salonNow.date &&
        startMinutes <= salonNow.minutes
      ) {
        throw new BadRequestException('Appointment time must be in the future');
      }

      const service = await db.orm.public.Service
        .where({ id: serviceId, isActive: true })
        .first();

      if (!service) {
        throw new BadRequestException('Service not found or inactive');
      }

      const durationMinutes = Number(service.durationMinutes);
      const endMinutes = startMinutes + durationMinutes;

      if (
        !Number.isFinite(durationMinutes) ||
        durationMinutes <= 0 ||
        operating.closed || startMinutes < operating.open ||
        endMinutes > operating.close ||
        (startMinutes-operating.open) % operating.interval !== 0
      ) {
        throw new BadRequestException('Appointment time is outside operating hours');
      }

      const appointments = await db.orm.public.Appointment
        .where({ appointmentDate })
        .all();
      const hasConflict = appointments.some((appointment) => {
        if (!['PENDING', 'CONFIRMED'].includes(String(appointment.status).toUpperCase())) {
          return false;
        }

        const bookedStart = this.timeToMinutes(String(appointment.startTime));
        const bookedEnd = this.timeToMinutes(String(appointment.endTime));
        return startMinutes < bookedEnd && endMinutes > bookedStart;
      });

      if (hasConflict) {
        throw new ConflictException('That appointment time is no longer available');
      }

      const created = await db.orm.public.Appointment.create({
        ...(userId ? { userId } : {}),
        serviceId,
        customerName: customerName.trim() as Varchar<150>,
        customerEmail: customerEmail.trim().toLowerCase() as Varchar<255>,
        appointmentDate,
        startTime,
        endTime: this.minutesToTime(endMinutes),
        status: 'PENDING' as Varchar<30>,
      });

      return {
        success: true,
        message: 'Appointment request received',
        data: created,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(
        'Failed to create appointment',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Unable to create appointment');
    }
  }

  async getAvailableSlots(date: string, serviceId: number) {
    this.validateDate(date);
    this.validateServiceId(serviceId);

    try {
      const service = await db.orm.public.Service
        .where({ id: serviceId, isActive: true })
        .all();

      if (service.length === 0) {
        throw new NotFoundException('Service not found or inactive');
      }

      const durationMinutes = Number(service[0].durationMinutes);

      if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
        throw new InternalServerErrorException(
          'Invalid service duration',
        );
      }

      const appointments = await db.orm.public.Appointment
        .where({ appointmentDate: date })
        .all();

      const bookedAppointments = appointments.filter((appointment) =>
        ['PENDING', 'CONFIRMED'].includes(
          String(appointment.status).toUpperCase(),
        ),
      );

      const operating=await this.operatingDay(date);
      const openingMinutes=operating.open;
      const closingMinutes=operating.closed?operating.open:operating.close;
      const slotInterval=operating.interval;
      const salonNow = this.salonDateTime();

      const slots: {
        startTime: string;
        endTime: string;
        available: boolean;
      }[] = [];

      for (
        let start = openingMinutes;
        start + durationMinutes <= closingMinutes;
        start += slotInterval
      ) {
        const end = start + durationMinutes;

        const overlaps = bookedAppointments.some((appointment) => {
          const bookedStart = this.timeToMinutes(
            String(appointment.startTime),
          );
          const bookedEnd = this.timeToMinutes(
            String(appointment.endTime),
          );

          return start < bookedEnd && end > bookedStart;
        });

        slots.push({
          startTime: this.minutesToTime(start),
          endTime: this.minutesToTime(end),
          available: !overlaps &&
            !(date === salonNow.date && start <= salonNow.minutes),
        });
      }

      return {
        date,
        serviceId,
        serviceDurationMinutes: durationMinutes,
        slots,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      this.logger.error(
        'Failed to retrieve available appointment slots',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Unable to retrieve available appointment slots',
      );
    }
  }

  async createAppointment(body: CreateAppointmentInput) {
    const date = body.appointmentDate;
    const serviceId = body.serviceId;
    const requestedTime = body.startTime;

    if (!date) {
      throw new BadRequestException('appointmentDate is required');
    }

    this.validateDate(date);

    if (!serviceId) {
      throw new BadRequestException('serviceId is required');
    }

    this.validateServiceId(serviceId);

    if (!requestedTime || !/^([01]\d|2[0-3]):[0-5]\d$/.test(requestedTime)) {
      throw new BadRequestException(
        'startTime must use HH:mm format, for example 14:30',
      );
    }

    const startMinutes = this.timeToMinutes(requestedTime);

    const operating=await this.operatingDay(date);
    if (operating.closed || startMinutes < operating.open || startMinutes >= operating.close) {
      throw new BadRequestException(
        'Appointments must start within salon operating hours',
      );
    }

    if ((startMinutes-operating.open) % operating.interval !== 0) {
      throw new BadRequestException(
        'Appointment start time must match the saved booking interval',
      );
    }

    if (
      body.userId !== undefined &&
      body.userId !== null &&
      (!Number.isInteger(body.userId) || body.userId <= 0)
    ) {
      throw new BadRequestException('userId must be a positive integer');
    }

    if (
      body.notes !== undefined &&
      body.notes !== null &&
      typeof body.notes !== 'string'
    ) {
      throw new BadRequestException('notes must be a string');
    }

    if (
      body.customerName !== undefined &&
      typeof body.customerName !== 'string'
    ) {
      throw new BadRequestException('customerName must be a string');
    }

    if (
      body.customerEmail !== undefined &&
      typeof body.customerEmail !== 'string'
    ) {
      throw new BadRequestException('customerEmail must be a string');
    }

    try {
      return await db.transaction(async (tx) => {
        const services = await tx.orm.public.Service
          .where({ id: serviceId, isActive: true })
          .all();

        if (services.length === 0) {
          throw new NotFoundException('Service not found or inactive');
        }

        const service = services[0];
        const durationMinutes = Number(service.durationMinutes);
        const endMinutes = startMinutes + durationMinutes;

        if (
          !Number.isFinite(durationMinutes) ||
          durationMinutes <= 0 ||
          endMinutes > operating.close
        ) {
          throw new BadRequestException(
            'The selected service cannot fit within salon operating hours',
          );
        }

        let customerName = body.customerName?.trim() ?? '';
        let customerEmail = body.customerEmail?.trim() ?? '';

        if (body.userId !== undefined && body.userId !== null) {
          const users = await tx.orm.public.User
            .where({ id: body.userId, isActive: true })
            .all();

          if (users.length === 0) {
            throw new BadRequestException(
              'The selected user does not exist or is inactive',
            );
          }

          const user = users[0];

          customerName ||= `${user.firstName} ${user.lastName}`.trim();
          customerEmail ||= user.email;
        }

        if (!customerName || customerName.length > 150) {
          throw new BadRequestException(
            'A customer name of 1–150 characters is required',
          );
        }

        if (
          customerEmail.length > 255 ||
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)
        ) {
          throw new BadRequestException(
            'A valid customerEmail is required',
          );
        }

        const appointments = await tx.orm.public.Appointment
          .where({ appointmentDate: date })
          .all();

        const bookedAppointments = appointments.filter((appointment) =>
          ['PENDING', 'CONFIRMED'].includes(
            String(appointment.status).toUpperCase(),
          ),
        );

        const overlaps = bookedAppointments.some((appointment) => {
          const bookedStart = this.timeToMinutes(
            String(appointment.startTime),
          );
          const bookedEnd = this.timeToMinutes(
            String(appointment.endTime),
          );

          return startMinutes < bookedEnd && endMinutes > bookedStart;
        });

        if (overlaps) {
          throw new ConflictException(
            'This appointment slot is no longer available',
          );
        }

        const dateCode = date.replaceAll('-', '');
        const referencePrefix = `CNTZ-${dateCode}-`;

        const nextSequence =
          appointments.reduce((highest, appointment) => {
            const reference = String(appointment.referenceCode ?? '');
            if (!reference.startsWith(referencePrefix)) {
              return highest;
            }

            const suffix = reference.slice(referencePrefix.length);
            if (!/^\d+$/.test(suffix)) {
              return highest;
            }

            return Math.max(highest, Number(suffix));
          }, 0) + 1;

        const referenceCode =
          `${referencePrefix}${String(nextSequence).padStart(2, '0')}`;

        const typedReferenceCode = referenceCode as Varchar<30>;
        const typedCustomerName = customerName as Varchar<150>;
        const typedCustomerEmail = customerEmail as Varchar<255>;
        const typedStatus = 'PENDING' as Varchar<30>;
        
        const created = await tx.orm.public.Appointment.create({
          referenceCode: typedReferenceCode,
          userId: body.userId ?? null,
          serviceId,
          customerName: typedCustomerName,
          customerEmail: typedCustomerEmail,
          appointmentDate: date,
          startTime: `${requestedTime}:00`,
          endTime: `${this.minutesToTime(endMinutes)}:00`,
          status: typedStatus,
          notes: body.notes?.trim() || null,
        });

        return {
          message: 'Appointment created successfully',
          appointment: created,
        };
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      this.logger.error(
        'Failed to create appointment',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Unable to create appointment',
      );
    }
  }
  
  async getCalendarLink(id: number) {
    const appointment = await this.getAppointmentForCalendar(id);

    const start = this.calendarDateTime(
      String(appointment.appointmentDate),
      String(appointment.startTime),
    );

    const end = this.calendarDateTime(
      String(appointment.appointmentDate),
      String(appointment.endTime),
    );

    const formatDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Centyzz Appointment - ${appointment.serviceName}`,
      dates: `${formatDate(start)}/${formatDate(end)}`,
      details: [
        `Reference: ${appointment.referenceCode ?? appointment.id}`,
        `Customer: ${appointment.customerName}`,
        appointment.notes ?? '',
      ].filter(Boolean).join('\n'),
      location: 'Centyzz Hair & Beauty Salon',
    });

    return {
      appointmentId: appointment.id,
      referenceCode: appointment.referenceCode,
      googleCalendarUrl:
        `https://calendar.google.com/calendar/render?${params.toString()}`,
    };
  }

  async getCalendarFile(id: number) {
    const appointment = await this.getAppointmentForCalendar(id);

    const start = this.calendarDateTime(
      String(appointment.appointmentDate),
      String(appointment.startTime),
    );

    const end = this.calendarDateTime(
      String(appointment.appointmentDate),
      String(appointment.endTime),
    );

    const escapeIcs = (value: string) =>
      value
        .replace(/\\/g, '\\\\')
        .replace(/;/g, '\\;')
        .replace(/,/g, '\\,')
        .replace(/\r?\n/g, '\\n');

    const formatDate = (date: Date) =>
      date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

    const content = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Centyzz//Salon Appointments//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      `UID:appointment-${appointment.id}@centyzz.local`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatDate(end)}`,
      `SUMMARY:${escapeIcs(`Centyzz Appointment - ${appointment.serviceName}`)}`,
      `DESCRIPTION:${escapeIcs(
        `Reference: ${appointment.referenceCode ?? appointment.id}\nCustomer: ${appointment.customerName}\n${appointment.notes ?? ''}`,
      )}`,
      `LOCATION:${escapeIcs('Centyzz Hair & Beauty Salon')}`,
      'END:VEVENT',
      'END:VCALENDAR',
      '',
    ].join('\r\n');

    return {
      filename: `centyzz-appointment-${appointment.id}.ics`,
      content,
    };
  }

  private async getAppointmentForCalendar(id: number) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException(
        'Appointment ID must be a positive integer',
      );
    }

    const appointments = await db.orm.public.Appointment
      .where({ id })
      .all();

    if (appointments.length === 0) {
      throw new NotFoundException('Appointment not found');
    }

    const appointment = appointments[0];

    const services = await db.orm.public.Service
      .where({ id: appointment.serviceId })
      .all();

    if (services.length === 0) {
      throw new NotFoundException('Appointment service not found');
    }

    return {
      ...appointment,
      serviceName: String(services[0].name),
    };
  }

  private calendarDateTime(date: string, time: string): Date {
    const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    const timeMatch = /^(\d{2}):(\d{2})(?::(\d{2}))?/.exec(time);

    if (!dateMatch || !timeMatch) {
      throw new InternalServerErrorException(
        'Invalid appointment date or time in database',
      );
    }

    const [, year, month, day] = dateMatch;
    const [, hour, minute, second = '00'] = timeMatch;

    return new Date(
      Date.UTC(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour) - 8,
        Number(minute),
        Number(second),
      ),
    );
  }

  private validateServiceId(serviceId: number) {
    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      throw new BadRequestException(
        'serviceId must be a positive integer',
      );
    }
  }

  private timeToMinutes(time: string): number {
    const match = time.match(
      /^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/,
    );

    if (!match) {
      throw new Error(`Unexpected time format: ${time}`);
    }

    return Number(match[1]) * 60 + Number(match[2]);
  }

  private validateDate(date: string): void {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must use YYYY-MM-DD format');
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);
    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException('Invalid appointment date');
    }

    if (date < this.salonDateTime().date) {
      throw new BadRequestException('Appointment date must be today or later');
    }
  }

  private salonDateTime(): { date: string; minutes: number } {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(new Date());
    const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
    return {
      date: `${part('year')}-${part('month')}-${part('day')}`,
      minutes: Number(part('hour')) * 60 + Number(part('minute')),
    };
  }

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(
      remainingMinutes,
    ).padStart(2, '0')}`;
  }
}
