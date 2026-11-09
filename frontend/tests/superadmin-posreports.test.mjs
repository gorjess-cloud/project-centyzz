import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const project = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const src = (file) => readFileSync(resolve(project, file), 'utf8');

const frontend = src('frontend/src/pages/superadmin/POSReportsView.jsx');
const layout = src('frontend/src/components/superadmin/SuperAdminLayout.jsx');
const controller = src('backend/src/superadmin/superadmin-reports.controller.ts');
const service = src('backend/src/superadmin/superadmin-reports.service.ts');
const moduleText = src('backend/src/superadmin/superadmin.module.ts');
const model = src('backend/src/prisma/contract.prisma');

test('Superadmin Reports page is independent and has no Admin page import', () => {
  assert.match(frontend, /export default function SuperadminPOSReportsView/);
  assert.doesNotMatch(frontend, /from\s+['"]\.\.\/admin\//);
  assert.doesNotMatch(frontend, /\/api\/admin\//);
});

test('Superadmin layout routes reports to Superadmin implementation', () => {
  assert.match(layout, /from\s+['"]\.\.\/\.\.\/pages\/superadmin\/POSReportsView['"]/);
  assert.match(layout, /reports:\s*<SuperadminPOSReportsView/);
});

test('POS read/write requests use the four Superadmin-only API routes', () => {
  for (const api of ['pos?', 'closeouts', 'closeout', 'closeout/']) {
    assert.ok(frontend.includes(`/api/superadmin/reports/${api}`));
  }
});

test('Reports controller is restricted to Superadmin and JWT', () => {
  assert.match(controller, /@Controller\('api\/superadmin\/reports'\)/);
  assert.match(controller, /@UseGuards\(JwtAuthGuard, SuperadminGuard\)/);
  for (const route of ["@Get('pos')", "@Get('closeouts')", "@Post('closeout')", "@Delete('closeout/:id')"]) {
    assert.ok(controller.includes(route));
  }
});

test('Superadmin module registers its own Reports controller/service', () => {
  assert.match(moduleText, /controllers: \[SuperadminController, SuperadminReportsController\]/);
  assert.match(moduleText, /\bSuperadminReportsService\b/);
});

test('Database reads reference the schema-backed tables and parameterized dates', () => {
  assert.match(model, /@@map\("pos_transactions"\)/);
  assert.match(model, /@@map\("closeout_reports"\)/);
  assert.match(service, /public\.pos_transactions/);
  assert.match(service, /public\.closeout_reports/);
  assert.match(service, /ANY\(\$1::text\[\]\)/);
  assert.doesNotMatch(service, /from\s+['"]\.\.\/admin\//);
});

test('Superadmin report handles errors and validates the physical cash count', () => {
  assert.match(frontend, /setLoadError\(err\.message/);
  assert.match(frontend, /validCashCount/);
  assert.match(frontend, /disabled=\{!closeoutInfo\.canClose \|\| isLoading/);
  assert.match(service, /ConflictException\('This date has already been closed\.'/);
});

test('Reconciles saved closeout snapshot separately from POS sales figures', () => {
  assert.match(service, /const mismatch = hasCloseoutRecord/);
  assert.match(service, /Saved closeout sales/);
  assert.match(service, /totalCashSales: hasCloseoutRecord \? savedCash : sums\.cash/);
  assert.match(service, /canClose = !closeout\?\.is_closed && raw\.length > 0 && !mismatch/);
  assert.match(frontend, /reconciliationIssues\.map/);
  assert.match(frontend, /!closeoutInfo\.canClose/);
});

test('Closeout insert supplies required cashier and preserves stored closeouts', () => {
  assert.match(service, /const cashier = String\(dto\?\.cashier \|\| ''\)\.trim\(\)/);
  assert.match(service, /\(report_date, cashier, opening_cash/);
  assert.match(service, /saved closeout and POS totals differ/i);
  assert.match(frontend, /cashier: cashierOnDuty\.trim\(\)/);
  assert.match(frontend, /Cashier on duty/);
});
