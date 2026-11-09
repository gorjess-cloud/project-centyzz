import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');
const login = read('frontend/src/pages/AuthPage.jsx');
const booking = read('backend/src/appointments/guest-booking.service.ts');
const controller = read('backend/src/appointments/appointments.controller.ts');
const modal = read('frontend/src/components/BookingModal.jsx');
const api = read('frontend/src/api/client.js');
test('6-digit PIN auto-submit and hardware keyboard supported', () => {
  assert.match(login, /pin\.join\(''\)\.length === 6/);
  assert.match(login, /window\.addEventListener\('keydown'/);
  assert.doesNotMatch(login, /Start Shift & Log In/);
  assert.match(login, /pinSubmittingRef\.current/);
});
test('no false paid demo flows on guest checkout', () => {
  assert.doesNotMatch(booking, /PAYMONGO_DEMO_ENABLED|DEMO_PAID|completeDemo/);
  assert.doesNotMatch(controller, /guest-demo/);
  assert.doesNotMatch(modal, /Simulate successful TEST deposit|finishDemo/);
});
test('real checkout called from backend with server key and supported e-wallets/QR', () => {
  assert.match(booking, /PAYMONGO_SECRET_KEY/);
  assert.match(booking, /api\.paymongo\.com\/v2\/checkout_sessions/);
  assert.match(booking, /\['gcash', 'paymaya', 'qrph'\]/);
  assert.doesNotMatch(modal, /sk_live_|PAYMONGO_SECRET_KEY/);
});
test('webhook verifies signature, provider mode, checkout identity and payment amount', () => {
  assert.match(booking, /timingSafeEqual/);
  assert.match(booking, /PAYMONGO_WEBHOOK_SECRET/);
  assert.match(booking, /appointment\.deposit_amount/);
  assert.match(booking, /payment_reference=\$2/);
  assert.match(booking, /liveMode \? 'PAID' : 'TEST_PAID'/);
});
test('calendar action requires server verified guest token and valid payment', () => {
  assert.match(controller, /@Post\('guest-calendar'\)/);
  assert.match(booking, /booking_token_hash=\$2/);
  assert.match(booking, /payment_status IN \('PAID','TEST_PAID'\)/);
  assert.match(modal, /Add to Google Calendar/);
  assert.match(api, /getGuestCalendar:/);
});
