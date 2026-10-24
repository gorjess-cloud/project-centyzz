import { AppointmentsController } from './appointments.controller.js';
import { AppointmentsService } from './appointments.service.js';
import { GuestBookingService } from './guest-booking.service.js';

describe('AppointmentsController', () => {
  let controller: AppointmentsController;
  const appointmentsService = {
    getAvailableSlots: vi.fn(),
    create: vi.fn(),
    findMine: vi.fn(),
    createForUser: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AppointmentsController(appointmentsService as unknown as AppointmentsService, {} as GuestBookingService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates appointments for the authenticated member', async () => {
    const appointment = {
      serviceId: 3,
      customerName: 'Member Name',
      customerEmail: 'member@example.com',
      appointmentDate: '2026-11-12',
      startTime: '14:00',
    };
    const request = { user: { sub: 12, email: 'member@example.com', role: 'CUSTOMER' } };

    await controller.createMine(appointment, request as never);

    expect(appointmentsService.createForUser).toHaveBeenCalledWith(
      appointment,
      12,
      'member@example.com',
    );
  });
});
