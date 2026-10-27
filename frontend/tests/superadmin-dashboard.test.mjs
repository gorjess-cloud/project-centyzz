import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDashboardMetrics, formatAuditLog, auditActionOptions } from '../src/components/superadmin/dashboardData.js';

const summary = {
  totalUsers: 6,
  accounts: { active: 3, inactive: 1, archived: 2 },
  codes: { verification: 1, recovery: 0, expired: 2 },
  errors: { last24Hours: 0, previous6Days: 0, older: 0 },
};

test('dashboard cards use backend values instead of fixed demo numbers', () => {
  const metrics = buildDashboardMetrics(summary);
  assert.deepEqual(metrics.map(metric => metric.items.reduce((sum, item) => sum + item.value, 0)), [6, 3, 0]);
  assert.equal(metrics[0].items[2].label, 'Archived');
  assert.equal(metrics[1].items[1].value, 0);
});

test('audit events display true database action and local timestamp', () => {
  const log = formatAuditLog({
    id: '24', actorName: 'Sample Operator', actorRole: 'SUPERADMIN',
    action: 'PRICE_CHANGED', entityType: 'SERVICE', entityId: '7',
    createdAt: '2026-10-26T16:00:00Z',
  });
  assert.equal(log.name, 'Sample Operator');
  assert.equal(log.role, 'Superadmin');
  assert.equal(log.action, 'Price changed');
  assert.equal(log.time, '12:00 AM');
  assert.match(log.subject, /#7/);
});

test('server-supported audit actions have dropdown filter options', () => {
  assert.deepEqual(auditActionOptions.map(option => option.value), [
    '', 'USER_ROLE_CHANGED', 'USER_ARCHIVED', 'PRICE_CHANGED',
  ]);
});
