import { describe, it, expect } from 'vitest';
import {
  validateSalonHours,
  validateSalonSection,
  DEFAULT_HOURS,
  SalonConfigService,
} from './salon-config.service.js';
import { validateAccountAvatar } from '../auth/account-avatar.js';
import { dashboardDate } from '../admin/workspace/workspace.service.js';

describe('salon preference validation', () => {
  it('accepts an ordered week and closed days without fabricating hours', () => {
    const days = structuredClone(DEFAULT_HOURS);
    days[0].closed = true;
    expect(validateSalonHours(days)[0].closed).toBe(true);
  });
  it.each([
    [],
    [...DEFAULT_HOURS, ...DEFAULT_HOURS],
    DEFAULT_HOURS.map((d, i) => ({ ...d, day: 6 - i })),
    DEFAULT_HOURS.map((d) => ({ ...d, start: '25:00' })),
    DEFAULT_HOURS.map((d) => ({ ...d, start: ['12:00'] })),
    DEFAULT_HOURS.map((d) => ({ ...d, start: '21:00', end: '12:00' })),
  ])('rejects malformed weekly hours %#', (days) =>
    expect(() => validateSalonHours(days)).toThrow(),
  );
  it('requires a supported interval and a numeric stock threshold', () => {
    expect(() =>
      validateSalonSection('hours', { days: DEFAULT_HOURS, slotInterval: 7 }),
    ).toThrow();
    expect(() =>
      validateSalonSection('inventory', {
        lowStockThreshold: '5',
        alertsEnabled: true,
      }),
    ).toThrow();
    expect(() =>
      validateSalonSection('inventory', {
        lowStockThreshold: -1,
        alertsEnabled: true,
      }),
    ).toThrow();
    expect(
      validateSalonSection('inventory', {
        lowStockThreshold: 0,
        alertsEnabled: false,
      }),
    ).toEqual({ lowStockThreshold: 0, alertsEnabled: false });
  });
  it('rejects invalid business contact data and unknown settings sections', () => {
    const profile = {
      salonName: 'Salon',
      address: 'Address',
      phone: '09123456789',
    };
    expect(() =>
      validateSalonSection('profile', { ...profile, email: 'wrong' }),
    ).toThrow();
    expect(() =>
      validateSalonSection('profile', { ...profile, phone: 'wrong' }),
    ).toThrow();
    expect(() =>
      validateSalonSection('profile', { ...profile, salonName: ' ' }),
    ).toThrow();
    expect(() => validateSalonSection('smtp', {})).toThrow();
  });
  it('whitelists the public profile and excludes private configuration', async () => {
    const service = Object.create(SalonConfigService.prototype);
    service.get = async () => ({
      profile: {
        salonName: 'Salon',
        address: 'Address',
        phone: '09123456789',
        email: '',
        description: 'Description',
        tin: 'PRIVATE',
        receiptHeader: 'PRIVATE',
      },
      hours: { days: DEFAULT_HOURS },
      timezone: 'Asia/Manila',
      smtpPassword: 'PRIVATE',
    });
    expect(await service.publicProfile()).toEqual({
      salonName: 'Salon',
      address: 'Address',
      phone: '09123456789',
      email: '',
      description: 'Description',
      hours: DEFAULT_HOURS,
      timezone: 'Asia/Manila',
    });
  });
  it('maps Sunday and Monday using the saved weekly hours and interval', async () => {
    const service = Object.create(SalonConfigService.prototype);
    const days = structuredClone(DEFAULT_HOURS);
    days[0] = { day: 0, closed: true, start: '09:00', end: '18:00' };
    service.get = async () => ({ hours: { days, slotInterval: 15 } });
    expect(await service.bookingDay('2026-11-02')).toEqual({
      closed: true,
      open: 540,
      close: 1080,
      interval: 15,
    });
    expect((await service.bookingDay('2026-11-01')).closed).toBe(false);
  });
});
describe('profile picture validation', () => {
  it('supports omission and explicit removal', () => {
    expect(validateAccountAvatar(undefined)).toBeUndefined();
    expect(validateAccountAvatar('')).toBe('');
  });
  it.each([
    'https://example.invalid/photo.jpg',
    'data:image/svg+xml;base64,PHN2Zz4=',
    'data:image/png;base64,aGVsbG8=',
    'data:image/png;base64,/9j/AA==',
  ])('rejects unsafe or mislabeled image content %s', (value) =>
    expect(() => validateAccountAvatar(value)).toThrow(),
  );
  it('rejects oversized image data even with a valid signature', () => {
    const bytes = Buffer.alloc(66000);
    bytes[0] = 255;
    bytes[1] = 216;
    bytes[2] = 255;
    expect(() =>
      validateAccountAvatar(
        'data:image/jpeg;base64,' + bytes.toString('base64'),
      ),
    ).toThrow();
  });
});
describe('dashboard dates', () => {
  it('accepts leap days and rejects normalized invalid dates', () => {
    expect(dashboardDate('2028-02-29')).toBe('2028-02-29');
    for (const value of [
      '2026-02-29',
      '2026-13-01',
      '2026-1-01',
      '../settings',
    ])
      expect(() => dashboardDate(value)).toThrow();
  });
});
