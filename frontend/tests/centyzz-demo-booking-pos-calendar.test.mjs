import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (path) => readFileSync(path, 'utf8');
const booking = src('backend/src/appointments/guest-booking.service.ts');
const controller = src('backend/src/appointments/appointments.controller.ts');
const modal = src('frontend/src/components/BookingModal.jsx');
const api = src('frontend/src/api/client.js');
const pos = src('frontend/src/pages/staff/StaffPOSView.jsx');
const payment = src('frontend/src/components/staff/payment.jsx');

test('booking starts demo only; no PayMongo session or webhook', () => {
  assert.match(booking, /mode: 'DEMO'/);
  assert.match(booking, /NODE_ENV === 'production'/);
  assert.doesNotMatch(booking, /api\.paymongo\.com|PAYMONGO_SECRET_KEY|paymongoWebhook/i);
  assert.doesNotMatch(controller, /paymongo-webhook|paymongoWebhook/i);
});
test('demo completion requires the booking token and locks slot', () => {
  assert.match(booking, /booking_token_hash=\$2/);
  assert.match(booking, /lockDate\(client, b\.appointment_date\)/);
  assert.match(booking, /reservation_expires_at > NOW\(\)/);
  assert.match(booking, /payment_status='DEMO_PAID'/);
  assert.match(controller, /guest-demo\/:id\/complete/);
});
test('guest checkout uses persisted status and supports calendar', () => {
  assert.match(booking, /payment_status IN \('PAID','TEST_PAID','DEMO_PAID'\)/);
  assert.match(controller, /@Post\('guest-calendar'\)/);
  assert.match(api, /finishGuestDemo:/);
  assert.match(api, /getGuestCalendar:/);
});
test('booking screen stays local with clearly labeled demo payment', () => {
  assert.match(modal, /setStep\('demo'\)/);
  assert.match(modal, /Simulate deposit and confirm booking/);
  assert.match(modal, /api\.finishGuestDemo/);
  assert.doesNotMatch(modal, /window\.location\.assign\(created\.checkoutUrl\)/);
});
test('calendar button appears after demo confirmation', () => {
  assert.match(modal, /paymentStatus === 'DEMO_PAID'/);
  assert.match(modal, /openingCalendar/);
  assert.match(modal, /Add to Google Calendar/);
});
test('POS checkout opens demo receipt without persisting a sale', () => {
  assert.match(pos, /setDemoReceipt\(sale\)/);
  assert.match(pos, /<DemoReceiptModal sale=\{demoReceipt\}/);
  assert.doesNotMatch(pos, /onSale\?\.\(sale\)/);
});
test('QR is non-scannable and demo only', () => {
  assert.match(payment, /Do not scan or send money/);
  assert.match(payment, /Simulate payment/);
  assert.doesNotMatch(payment, /cellsOn|N \* N|<svg viewBox/);
});
test('receipt includes items, totals and prominent simulation notice', () => {
  assert.match(payment, /DEMO — NOT A PROOF OF PAYMENT/);
  assert.match(payment, /sale\.items\.map/);
  assert.match(payment, /sale\.payments\.map/);
  assert.match(payment, /Print demo receipt/);
});
test('PIN/auth files are intentionally outside the changed files list', () => {
  const installer = src('Install-CentyzzDemoBookingPOS.ps1');
  assert.doesNotMatch(installer, /Rel = 'frontend\/src\/pages\/AuthPage\.jsx'/);
  assert.doesNotMatch(installer, /Rel = 'frontend\/src\/pages\/admin\//);
});
