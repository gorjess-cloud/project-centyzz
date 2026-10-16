import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import type { Varchar } from '@prisma/orm-postgres/target/codec-types';
import type { CreateAppointmentDto } from './dto/create-appointment.dto.js';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

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
        startMinutes < 12 * 60 ||
        endMinutes > 21 * 60 ||
        startMinutes % 30 !== 0
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

    if (!Number.isInteger(serviceId) || serviceId <= 0) {
      throw new BadRequestException(
        'service_id must be a positive integer',
      );
    }

    try {
      const service = await db.orm.public.Service
        .where({
          id: serviceId,
          isActive: true,
        })
        .all();

      if (service.length === 0) {
        throw new BadRequestException(
          'Service not found or inactive',
        );
      }

      const durationMinutes = Number(
        service[0].durationMinutes,
      );

      if (
        !Number.isFinite(durationMinutes) ||
        durationMinutes <= 0
      ) {
        throw new InternalServerErrorException(
          'Invalid service duration',
        );
      }

      const appointments = await db.orm.public.Appointment
        .where({
          appointmentDate: date,
        })
        .all();

      const unavailableStatuses = [
        'PENDING',
        'CONFIRMED',
      ];

      const bookedAppointments = appointments.filter(
        (appointment) =>
          unavailableStatuses.includes(
            String(appointment.status).toUpperCase(),
          ),
      );

      // Salon operating hours: 12:00 NN to 9:00 PM.
      // Slots begin every 30 minutes.
      const openingMinutes = 12 * 60;
      const closingMinutes = 21 * 60;
      const slotInterval = 30;
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

        const overlaps = bookedAppointments.some(
          (appointment) => {
            const bookedStart = this.timeToMinutes(
              String(appointment.startTime),
            );

            const bookedEnd = this.timeToMinutes(
              String(appointment.endTime),
            );

            return start < bookedEnd && end > bookedStart;
          },
        );

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
      if (error instanceof BadRequestException) {
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

  private timeToMinutes(time: string): number {
    const match = time.match(/^(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/);

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