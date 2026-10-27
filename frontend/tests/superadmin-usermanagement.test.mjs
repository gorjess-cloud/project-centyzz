import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Admin User Management remains its original standalone page', () => {
  const admin = read('src/pages/admin/UserManagementView.jsx');
  assert.match(admin, /export default function UserManagementView/);
  assert.match(admin, /\/api\/admin\/users/);
  assert.doesNotMatch(admin, /UserManagementWorkspace/);
  assert.doesNotMatch(admin, /\/api\/superadmin\/users/);
});

test('Admin backend remains on its own UsersService and guard', () => {
  const controller = read('../backend/src/admin/users/users.controller.ts');
  const service = read('../backend/src/admin/users/users.service.ts');
  const module = read('../backend/src/admin/users/users.module.ts');
  assert.match(controller, /UsersService/);
  assert.match(controller, /\.\/management-action-pin\.guard\.js/);
  assert.match(module, /\.\/management-action-pin\.guard\.js/);
  assert.doesNotMatch(service, /managementUserRecord/);
  assert.match(controller, /api\/admin\/users/);
});

test('Superadmin has its own page and route, without importing Admin page', () => {
  const layout = read('src/components/superadmin/SuperAdminLayout.jsx');
  const superadmin = read('src/pages/superadmin/UserManagementView.jsx');
  const workspace = read('src/components/users/UserManagementWorkspace.jsx');
  assert.match(layout, /pages\/superadmin\/UserManagementView/);
  assert.doesNotMatch(layout, /pages\/admin\/UserManagementView/);
  assert.match(superadmin, /apiBase="\/api\/superadmin\/users"/);
  assert.match(superadmin, /visibleRoles=\{\['SUPERADMIN', 'ADMIN', 'STAFF'\]\}/);
  assert.doesNotMatch(superadmin, /pages\/admin/);
  assert.match(workspace, /formattedRole === 'SUPERADMIN'/);
  assert.match(workspace, /fetch\(`\$\{apiBase\}/);
  assert.doesNotMatch(workspace, /fetch\(['"`]\/api\/admin\/users/);
});

test('Superadmin backend is independent and archivedAt uses typed ORM property', () => {
  const controller = read('../backend/src/superadmin/superadmin.controller.ts');
  const service = read('../backend/src/superadmin/superadmin-users.service.ts');
  assert.match(controller, /api\/superadmin/);
  assert.match(controller, /this\.superadminUsers\.listUsers/);
  assert.match(service, /Boolean\(u\.archivedAt\)/);
  assert.doesNotMatch(service, /u\.archived_at/);
  assert.doesNotMatch(service, /UsersService.*from.*admin/);
  assert.match(service, /'SUPERADMIN'/);
});
