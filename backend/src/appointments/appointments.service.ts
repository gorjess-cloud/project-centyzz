
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import type { Varchar } from '@prisma/orm-postgres/target/codec-types';

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
  private readonly logger = new Logger(AppointmentsService.name);

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

      const openingMinutes = 12 * 60;
      const closingMinutes = 21 * 60;
      const slotInterval = 30;

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
          available: !overlaps,
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

    if (startMinutes < 12 * 60 || startMinutes >= 21 * 60) {
      throw new BadRequestException(
        'Appointments must start between 12:00 and 20:30',
      );
    }

    if (startMinutes % 30 !== 0) {
      throw new BadRequestException(
        'Appointment start times must be in 30-minute intervals',
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
        // Serialize booking attempts for the same date.
        // The advisory lock is released when the transaction ends.

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
          endMinutes > 21 * 60
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

    // Appointment times are Philippine local time (UTC+08:00).
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

  private validateDate(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException(
        'date must use YYYY-MM-DD format',
      );
    }

    const parsedDate = new Date(`${date}T00:00:00.000Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== date
    ) {
      throw new BadRequestException('Invalid appointment date');
    }
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

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(
      remainingMinutes,
    ).padStart(2, '0')}`;
  }
}
