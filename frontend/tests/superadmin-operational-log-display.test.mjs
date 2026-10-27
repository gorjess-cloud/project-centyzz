import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = file => readFileSync(path.join(root, file), 'utf8');
const serviceFile = 'backend/src/superadmin/superadmin-operational-logs.service.ts';
const serviceSource = read(serviceFile);
const page = read('frontend/src/pages/superadmin/OperationalLogsView.jsx');

function getFormatterService() {
  const fromBackend = createRequire(path.join(root, 'backend/package.json'));
  const ts = fromBackend('typescript');
  const result = ts.transpileModule(serviceSource, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.CommonJS,
      experimentalDecorators: true,
      esModuleInterop: true,
    },
    reportDiagnostics: true,
  });
  assert.equal((result.diagnostics || []).filter(d => d.category === ts.DiagnosticCategory.Error).length, 0);
  const module = { exports: {} };
  const mockedRequire = name => {
    if (name === '@nestjs/common') return {
      Injectable: () => clazz => clazz,
      BadRequestException: class BadRequestException extends Error {},
      NotFoundException: class NotFoundException extends Error {},
    };
    if (name === 'pg') return { Pool: class Pool { async end() {} } };
    throw new Error(`Unexpected backend import: ${name}`);
  };
  vm.runInNewContext(result.outputText, {
    module, exports: module.exports, require: mockedRequire, process: { env: {} },
  }, { filename: 'superadmin-operational-logs.service.js' });
  return new module.exports.SuperadminOperationalLogsService();
}
function audit(overrides = {}) {
  return {
    source: 'audit', source_id: '1', occurred_at: '2026-10-23T09:58:31Z',
    module: 'User Management', action: 'USER_ROLE_CHANGED', actor_id: 1,
    actor_name: 'Super Admin', actor_role: 'SUPERADMIN', entity_type: 'USER',
    entity_id: '3', entity_name: 'Example Employee',
    old_values: { role: 'ADMIN' }, new_values: { role: 'SUPERADMIN' },
    reason: 'Development administrator role recovery', quantity_change: null,
    product_id: null, archived_at: null, ...overrides,
  };
}

test('audit roles become readable account changes without raw JSON or # identifiers', () => {
  const row = getFormatterService().normalize(audit());
  assert.match(row.details, /Account: Example Employee/);
  assert.match(row.details, /Role: Admin → Superadmin/);
  assert.match(row.details, /Reason: Development administrator role recovery/);
  assert.doesNotMatch(row.details, /[{}]|USER #|Before:|After:/);
});

test('service prices show the current service name and PHP currency', () => {
  const row = getFormatterService().normalize(audit({
    action: 'PRICE_CHANGED', entity_type: 'SERVICE', entity_id: '1',
    entity_name: 'Hair Rebonding', old_values: { price: 151 }, new_values: { price: 150 },
    reason: null,
  }));
  assert.equal(row.details, 'Service: Hair Rebonding\nPrice: ₱151.00 → ₱150.00');
});

test('missing or deleted records use honest readable ID fallback', () => {
  const row = getFormatterService().normalize(audit({ entity_name: null }));
  assert.match(row.details, /Account: User record \(ID 3\)/);
});

test('inventory movement shows quantity and reason without JSON', () => {
  const row = getFormatterService().normalize(audit({
    source: 'inventory', action: 'STOCK_OUT', entity_type: 'INVENTORY_PRODUCT',
    entity_id: '9', entity_name: null, old_values: null, new_values: null,
    quantity_change: -5, reason: 'Used at POS',
  }));
  assert.match(row.details, /Product: Product record \(ID 9\)/);
  assert.match(row.details, /Stock movement: -5 units/);
});

test('audit record names resolve through Superadmin-only read queries', () => {
  assert.match(serviceSource, /LEFT JOIN public\."user" target_user/);
  assert.match(serviceSource, /LEFT JOIN public\.services target_service/);
  assert.match(serviceSource, /COALESCE\(entity_name,''\) ILIKE/);
  assert.doesNotMatch(serviceSource, /JSON\.stringify\(before\)|JSON\.stringify\(after\)/);
});

test('Module column uses same bold font weight as event and actor', () => {
  assert.match(page, /<td className="p-4 font-bold text-\[#2A1E1B\]">\{row\.module\}<\/td>/);
  assert.match(page, /<td className="p-4 font-bold">\{row\.event\}<\/td>/);
});
