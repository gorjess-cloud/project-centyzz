import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = file => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');
const page = read('src/components/superadmin/SuperAdminSettings.jsx');
const layout = read('src/components/superadmin/SuperAdminLayout.jsx');
const controller = read('../backend/src/superadmin/superadmin-settings.controller.ts');
const guard = read('../backend/src/superadmin/superadmin.controller.ts');
const service = read('../backend/src/superadmin/superadmin-settings.service.ts');
const module = read('../backend/src/superadmin/superadmin.module.ts');
test('Superadmin Settings has live backup endpoints and does not fabricate sample jobs', () => {
  assert.match(page, /settings\/db-backups/);
  assert.match(page, /settings\/db-backup/);
  assert.doesNotMatch(page, /createPreviewBackups|centyzz-backups-ui-preview/);
});
test('Maintenance read/write uses a protected Superadmin controller', () => {
  assert.match(controller, /JwtAuthGuard, SuperadminGuard/);
  assert.match(controller, /@UseGuards\(ManagementActionPinGuard\)/);
  assert.match(controller, /@Patch\('maintenance'\)/);
});
test('Backup creation needs management PIN and existing backup job route', () => {
  assert.match(guard, /@Post\('settings\/db-backup'\)\s*@UseGuards\(ManagementActionPinGuard\)/);
});
test('Superadmin service persists change and records audit, not pretend enforcement', () => {
  assert.match(service, /UPDATE public\.superadmin_maintenance_settings/);
  assert.match(service, /INSERT INTO public\.audit_logs/);
  assert.match(service, /enforcementActive: false/);
});
test('Dashboard and Settings use their own Superadmin components', () => {
  assert.match(layout, /settings: <SuperAdminSettings currentUser=/);
  assert.doesNotMatch(layout, /audit: <AuditTable/);
  assert.match(module, /SuperadminSettingsController/);
  assert.match(module, /SuperadminSettingsService/);
});
