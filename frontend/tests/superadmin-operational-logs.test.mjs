import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Superadmin Operational Logs is an independent page', () => {
  const layout = read('frontend/src/components/superadmin/SuperAdminLayout.jsx');
  assert.match(layout, /import SuperadminOperationalLogsView from '\.\.\/\.\.\/pages\/superadmin\/OperationalLogsView'/);
  assert.match(layout, /logs: <SuperadminOperationalLogsView currentUser=\{currentUser\}/);
  assert.doesNotMatch(layout, /import OperationalLogsView from '\.\.\/\.\.\/pages\/admin\//);
});
test('System Audit page uses technical errors, not the operational audit endpoint', () => {
  const page = read('frontend/src/pages/superadmin/SystemAuditLogsView.jsx');
  assert.match(page, /\/api\/superadmin\/errors/);
  assert.doesNotMatch(page, /\/api\/superadmin\/logs\?/);
});
test('Superadmin operational backend is JWT and role protected', () => {
  const controller = read('backend/src/superadmin/superadmin-operational-logs.controller.ts');
  assert.match(controller, /@UseGuards\(JwtAuthGuard, SuperadminGuard\)/);
  assert.match(controller, /@UseGuards\(ManagementActionPinGuard\)/);
  assert.match(controller, /@Get\('export'\)/);
});
test('Archive does not mutate original business records', () => {
  const service = read('backend/src/superadmin/superadmin-operational-logs.service.ts');
  assert.match(service, /INSERT INTO public\.superadmin_log_archives/);
  assert.match(service, /DELETE FROM public\.superadmin_log_archives/);
  assert.doesNotMatch(service, /DELETE FROM public\.(audit_logs|inventory_movements)/);
  assert.match(service, /INSERT INTO public\.audit_logs/);
});
test('Live audit and inventory movements are read and joined to users', () => {
  const service = read('backend/src/superadmin/superadmin-operational-logs.service.ts');
  assert.match(service, /FROM public\.audit_logs a/);
  assert.match(service, /FROM public\.inventory_movements m/);
  assert.match(service, /LEFT JOIN public\."user" u/);
});
