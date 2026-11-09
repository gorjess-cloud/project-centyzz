import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = file => fs.readFileSync(file, 'utf8');
test('Maintenance is enforced via global guard registered in SuperadminModule', () => {
  const module = read('backend/src/superadmin/superadmin.module.ts');
  const guard = read('backend/src/superadmin/maintenance-access.guard.ts');
  assert.match(module, /APP_GUARD/);
  assert.match(guard, /MAINTENANCE_MODE/);
  assert.match(guard, /verifyAsync/);
  assert.match(guard, /SUPERADMIN/);
  assert.match(guard, /getPublicMaintenance/);
});
test('Public maintenance status available without a login', () => {
  assert.match(read('backend/src/superadmin/public-maintenance.controller.ts'), /@Get\('status'\)/);
});
test('Authenticated non-Superadmin UI is gated in shared App entrypoint', () => {
  const app = read('frontend/src/App.jsx');
  assert.match(app, /MaintenanceGate/);
  assert.match(app, /maintenance\/status/);
  assert.match(app, /SUPERADMIN/);
});
test('Backup dumps require Superadmin and management PIN', () => {
  const ctrl = read('backend/src/superadmin/superadmin-backup-download.controller.ts');
  assert.match(ctrl, /JwtAuthGuard, SuperadminGuard/);
  assert.match(ctrl, /ManagementActionPinGuard/);
  assert.match(ctrl, /GetObjectCommand/);
});
test('Restore and delete are deliberately disabled rather than simulated', () => {
  const manager = read('frontend/src/components/superadmin/SuperadminBackupManager.jsx');
  assert.match(manager, /Restore Database \(not available\)/);
  assert.match(manager, /Permanent deletion is disabled/);
});
test('Maintenance success confirmation appears after PIN save', () => {
  const settings = read('frontend/src/components/superadmin/SuperAdminSettings.jsx');
  assert.match(settings, /Maintenance mode successfully turned on/);
  assert.match(settings, /FeedbackDialog/);
});
