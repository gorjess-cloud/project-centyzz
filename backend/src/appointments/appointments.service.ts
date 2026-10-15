import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { db } from '../prisma/db.js';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  async getAvailableSlots(date: string, serviceId: number) {
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

  private minutesToTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(
      remainingMinutes,
    ).padStart(2, '0')}`;
  }
}