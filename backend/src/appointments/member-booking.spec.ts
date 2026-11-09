import { validate } from 'class-validator';
import { AppointmentsService } from './appointments.service.js';
import {
  memberServiceIds,
  MemberBookingService,
} from './member-booking.service.js';
import { CreateAppointmentDto } from './dto/create-appointment.dto.js';
import { db } from '../prisma/db.js';
vi.mock('../prisma/db.js', () => ({
  db: {
    orm: {
      public: { Appointment: { where: vi.fn() }, Service: { where: vi.fn() } },
    },
  },
}));

describe('Combined Client appointments and Calendar', () => {
  const row = {
    id: 27,
    userId: 12,
    serviceId: 3,
    appointmentDate: '2026-11-12',
    startTime: '14:00:00',
    endTime: '15:30:00',
    referenceCode: 'CNTZ-EXAMPLE',
    customerName: 'Client',
    notes: '',
    status: 'PENDING',
  };
  const summary = {
    service: {
      id: 3,
      name: 'Haircut, Hair Coloring',
      price: 650,
      durationMinutes: 90,
    },
    services: [
      { id: 3, name: 'Haircut' },
      { id: 4, name: 'Hair Coloring' },
    ],
  };
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(db.orm.public.Appointment.where).mockReturnValue({
      all: async () => [row],
      first: async () => row,
    } as never);
    vi.mocked(db.orm.public.Service.where).mockReturnValue({
      all: async () => [{ name: 'Haircut' }],
    } as never);
  });
  it('rejects empty, duplicate, non-integer and excessive service lists', () => {
    for (const ids of [
      [],
      [1, 1],
      [1.5],
      ['3'],
      Array.from({ length: 21 }, (_, i) => i + 1),
    ])
      expect(() => memberServiceIds(ids)).toThrow();
    expect(memberServiceIds([3, 4])).toEqual([3, 4]);
  });
  it('accepts the grouped request DTO and retains legacy one-service requests', async () => {
    const base = {
      customerName: 'Client',
      customerEmail: 'client@example.com',
      appointmentDate: '2026-11-12',
      startTime: '14:00',
    };
    expect(
      await validate(
        Object.assign(new CreateAppointmentDto(), base, { serviceIds: [3, 4] }),
      ),
    ).toHaveLength(0);
    expect(
      await validate(
        Object.assign(new CreateAppointmentDto(), base, { serviceId: 3 }),
      ),
    ).toHaveLength(0);
    expect(
      (
        await validate(
          Object.assign(new CreateAppointmentDto(), base, {
            serviceIds: [3, 3],
          }),
        )
      ).length,
    ).toBeGreaterThan(0);
  });
  it('delegates the full group once to the atomic booking service with the trusted user', async () => {
    const member = {
      create: vi.fn().mockResolvedValue({ success: true, data: { id: 27 } }),
    };
    const service = new AppointmentsService(
      undefined,
      member as unknown as MemberBookingService,
    );
    const input = {
      serviceIds: [3, 4],
      appointmentDate: '2026-11-12',
      startTime: '14:00',
    };
    await service.createForUser(
      input as CreateAppointmentDto,
      12,
      'client@example.com',
    );
    expect(member.create).toHaveBeenCalledExactlyOnceWith(
      input,
      12,
      'client@example.com',
    );
  });
  it('generates one Google event with every service and the full interval in Philippine time', async () => {
    const member = {
      summaries: vi.fn().mockResolvedValue(new Map([[27, summary]])),
    };
    const service = new AppointmentsService(
      undefined,
      member as unknown as MemberBookingService,
    );
    const result = await service.getCalendarLink(27),
      url = new URL(result.googleCalendarUrl);
    expect(url.origin).toBe('https://calendar.google.com');
    expect(url.searchParams.get('text')).toBe(
      'Centyzz Appointment - Haircut, Hair Coloring',
    );
    expect(url.searchParams.get('dates')).toBe(
      '20261112T060000Z/20261112T073000Z',
    );
    expect(url.searchParams.get('details')).toContain('CNTZ-EXAMPLE');
  });
  it('generates an ICS event with the same grouped duration', async () => {
    const service = new AppointmentsService(undefined, {
      summaries: async () => new Map([[27, summary]]),
    } as unknown as MemberBookingService);
    const result = await service.getCalendarFile(27);
    expect(result.content).toContain('DTSTART:20261112T060000Z');
    expect(result.content).toContain('DTEND:20261112T073000Z');
    expect(result.content).toContain('Haircut\\, Hair Coloring');
  });
  it('checks Calendar ownership against the authenticated user', async () => {
    const service = new AppointmentsService();
    vi.mocked(db.orm.public.Appointment.where).mockReturnValue({
      first: async () => null,
    } as never);
    await expect(service.getCalendarForUser(27, 99)).rejects.toThrow(
      'Appointment not found',
    );
    expect(db.orm.public.Appointment.where).toHaveBeenCalledWith({
      id: 27,
      userId: 99,
    });
  });
  it('rejects cancelled appointments from the member Calendar action', async () => {
    vi.mocked(db.orm.public.Appointment.where).mockReturnValue({
      first: async () => ({ ...row, status: 'CANCELLED' }),
    } as never);
    await expect(
      new AppointmentsService().getCalendarForUser(27, 12),
    ).rejects.toThrow('active scheduled appointment');
  });
  it('keeps single-service legacy/guest Calendar events valid', async () => {
    const result = await new AppointmentsService().getCalendarLink(27);
    expect(new URL(result.googleCalendarUrl).searchParams.get('text')).toBe(
      'Centyzz Appointment - Haircut',
    );
  });
});
