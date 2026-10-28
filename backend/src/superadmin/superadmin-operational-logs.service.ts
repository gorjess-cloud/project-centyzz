import { BadRequestException, Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

type Filters = {
  page?: string; limit?: string; search?: string; date?: string;
  module?: string; role?: string; archived?: string; status?: string;
};
type OperationalRow = {
  [key: string]: any;
  source: 'audit' | 'inventory'; source_id: string; occurred_at: Date;
  module: string; action: string; actor_id: number | null;
  actor_name: string; actor_role: string; entity_type: string | null;
  entity_id: string | null; entity_name: string | null; old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null; reason: string | null;
  quantity_change: number | null; product_id: number | null;
  archived_at: Date | null;
};

const MODULES = [
  'Account & Access', 'User Management', 'Staff & Service',
  'Client & Appointments', 'POS & Financial', 'Inventory',
  'Permissions', 'Other Operations',
];
const ROLES = ['SUPERADMIN', 'ADMIN', 'STAFF', 'CUSTOMER', 'SYSTEM', 'UNKNOWN'];
const SAFE_CHANGE_FIELDS = new Set([
  'role', 'price', 'oldPrice', 'newPrice', 'isActive', 'status',
  'amount', 'discount', 'quantity', 'stock', 'archivedAt', 'name',
  'serviceName', 'reason',
]);
function cleanChanges(value: Record<string, unknown> | null): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key]) => SAFE_CHANGE_FIELDS.has(key)));
}
function eventName(action: string) {
  return action.toLowerCase().split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
const FIELD_LABELS: Record<string, string> = {
  role: 'Role', price: 'Price', oldPrice: 'Previous price', newPrice: 'New price',
  isActive: 'Account status', status: 'Status', amount: 'Amount',
  discount: 'Discount', quantity: 'Quantity', stock: 'Stock',
  archivedAt: 'Archived date', name: 'Name', serviceName: 'Service', reason: 'Reason',
};
const MONEY_FIELDS = new Set(['price', 'oldPrice', 'newPrice', 'amount', 'discount']);
function readableValue(field: string, value: unknown): string {
  if (value == null || value === '') return 'Not set';
  if (typeof value === 'boolean') {
    if (field === 'isActive') return value ? 'Active' : 'Inactive';
    return value ? 'Yes' : 'No';
  }
  if (MONEY_FIELDS.has(field) && typeof value !== 'object' && Number.isFinite(Number(value))) {
    return `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const text = String(value);
    return ['role', 'status'].includes(field) ? eventName(text.replace(/\s+/g, '_')) : text;
  }
  // Never render arbitrary audit JSON objects verbatim in the operational register.
  return 'Updated';
}
function displayChanges(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  const fields = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...fields].map(field => {
    const label = FIELD_LABELS[field] || field;
    const hasBefore = Object.hasOwn(before, field);
    const hasAfter = Object.hasOwn(after, field);
    if (hasBefore && hasAfter) {
      return `${label}: ${readableValue(field, before[field])} → ${readableValue(field, after[field])}`;
    }
    return hasBefore
      ? `Previous ${label.toLowerCase()}: ${readableValue(field, before[field])}`
      : `${label}: ${readableValue(field, after[field])}`;
  });
}
function entityDescription(row: OperationalRow): string {
  if (!row.entity_id) return '';
  const type = (row.entity_type || '').toUpperCase();
  if (type === 'USER') return `Account: ${row.entity_name || `User record (ID ${row.entity_id})`}`;
  if (type === 'SERVICE') return `Service: ${row.entity_name || `Service record (ID ${row.entity_id})`}`;
  if (type === 'INVENTORY_PRODUCT') return `Product: ${row.entity_name || `Product record (ID ${row.entity_id})`}`;
  if (type === 'OPERATIONAL_LOG') return `Operational log: ${row.entity_id}`;
  const label = type ? eventName(type) : 'Related record';
  return `${label}: ${row.entity_name || `Record (ID ${row.entity_id})`}`;
}
function escapeCsv(value: unknown): string {
  let text = String(value ?? '').replace(/\r\n?/g, '\n');
  // Avoid spreadsheet formula execution when a log contains attacker-controlled text.
  if (/^[\s\uFEFF]*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

@Injectable()
export class SuperadminOperationalLogsService implements OnModuleDestroy {
  private readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 3 });
  async onModuleDestroy() { await this.pool.end(); }

  private readonly rowsSql = `
    WITH combined AS (
      SELECT 'audit'::text AS source, a.id AS source_id, a.created_at AS occurred_at,
        CASE
          WHEN a.action ILIKE '%LOGIN%' OR a.action ILIKE '%LOGOUT%' OR a.action ILIKE '%PASSWORD%' OR a.action ILIKE '%PIN%' THEN 'Account & Access'
          WHEN a.action ILIKE '%PERMISSION%' OR a.entity_type ILIKE '%PERMISSION%' THEN 'Permissions'
          WHEN a.entity_type ILIKE '%USER%' OR a.action ILIKE 'USER_%' THEN 'User Management'
          WHEN a.entity_type ILIKE '%SERVICE%' OR a.action ILIKE '%PRICE%' OR a.action ILIKE '%STAFF%' THEN 'Staff & Service'
          WHEN a.entity_type ILIKE '%APPOINTMENT%' OR a.entity_type ILIKE '%CLIENT%' THEN 'Client & Appointments'
          WHEN a.entity_type ILIKE '%TRANSACTION%' OR a.entity_type ILIKE '%PAYMENT%' OR a.action ILIKE '%POS%' OR a.action ILIKE '%CLOSEOUT%' OR a.action ILIKE '%DISCOUNT%' OR a.action ILIKE '%REFUND%' THEN 'POS & Financial'
          WHEN a.entity_type ILIKE '%INVENTORY%' OR a.entity_type ILIKE '%PRODUCT%' OR a.action ILIKE '%STOCK%' THEN 'Inventory'
          ELSE 'Other Operations' END AS module,
        a.action::text AS action, a.actor_id,
        COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u."firstName", u."lastName")), ''),
          CASE WHEN a.actor_id IS NULL THEN 'System' ELSE 'User #' || a.actor_id::text END) AS actor_name,
        CASE WHEN u.id IS NOT NULL THEN UPPER(u.role) WHEN a.actor_id IS NULL THEN 'SYSTEM' ELSE 'UNKNOWN' END AS actor_role,
        a.entity_type::text, a.entity_id::text,
        CASE
          WHEN UPPER(COALESCE(a.entity_type, '')) = 'USER' THEN
            COALESCE(NULLIF(TRIM(CONCAT_WS(' ', target_user."firstName", target_user."lastName")), ''), target_user.email)
          WHEN UPPER(COALESCE(a.entity_type, '')) = 'SERVICE' THEN target_service.name
          ELSE NULL END AS entity_name,
        a.old_values, a.new_values, a.reason,
        NULL::integer AS quantity_change, NULL::integer AS product_id,
        archive.archived_at
      FROM public.audit_logs a
      LEFT JOIN public."user" u ON u.id = a.actor_id
      LEFT JOIN public."user" target_user ON UPPER(COALESCE(a.entity_type, '')) = 'USER'
        AND target_user.id::text = a.entity_id
      LEFT JOIN public.services target_service ON UPPER(COALESCE(a.entity_type, '')) = 'SERVICE'
        AND target_service.id::text = a.entity_id
      LEFT JOIN public.superadmin_log_archives archive ON archive.source='audit' AND archive.source_id=a.id
      UNION ALL
      SELECT 'inventory'::text, m.id, m.created_at, 'Inventory'::text,
        'STOCK_' || UPPER(m.movement_type), m.performed_by,
        COALESCE(NULLIF(TRIM(CONCAT_WS(' ', u."firstName", u."lastName")), ''), 'User #' || m.performed_by::text),
        CASE WHEN u.id IS NOT NULL THEN UPPER(u.role) ELSE 'UNKNOWN' END,
        'INVENTORY_PRODUCT'::text, m.product_id::text, NULL::text,
        NULL::jsonb, NULL::jsonb, m.reason, m.quantity_change, m.product_id,
        archive.archived_at
      FROM public.inventory_movements m
      LEFT JOIN public."user" u ON u.id = m.performed_by
      LEFT JOIN public.superadmin_log_archives archive ON archive.source='inventory' AND archive.source_id=m.id
    ), filtered AS (
      SELECT * FROM combined
      WHERE ($2::date IS NULL OR (occurred_at AT TIME ZONE 'Asia/Manila')::date = $2::date)
        AND ($3::text = '' OR module = $3)
        AND ($4::text = '' OR actor_role = $4)
        AND (($5::boolean AND archived_at IS NOT NULL) OR (NOT $5::boolean AND archived_at IS NULL))
        AND ($1::text = '' OR actor_name ILIKE $1 ESCAPE '!' OR action ILIKE $1 ESCAPE '!'
          OR module ILIKE $1 ESCAPE '!' OR COALESCE(entity_id,'') ILIKE $1 ESCAPE '!'
          OR COALESCE(entity_name,'') ILIKE $1 ESCAPE '!'
          OR COALESCE(reason,'') ILIKE $1 ESCAPE '!')
    )
  `;

  private parameters(filters: Filters) {
    const page = Number(filters.page ?? 1), limit = Number(filters.limit ?? 8);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException('Invalid page or page size.');
    }
    if ((page - 1) * limit > Number.MAX_SAFE_INTEGER) throw new BadRequestException('Invalid page.');
    const search = String(filters.search ?? '').trim();
    const date = String(filters.date ?? '').trim();
    const module = String(filters.module ?? 'ALL');
    const role = String(filters.role ?? 'ALL').toUpperCase();
    const status = String(filters.status ?? 'ALL').toUpperCase();
    if (search.length > 150 || (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) ||
        !['ALL', ...MODULES].includes(module) || !['ALL', ...ROLES].includes(role) ||
        !['ALL', 'RECORDED'].includes(status) || !['true', 'false', ''].includes(String(filters.archived ?? 'false'))) {
      throw new BadRequestException('Invalid log filters.');
    }
    if (date && (() => { const parsed = new Date(`${date}T00:00:00Z`); return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date; })()) throw new BadRequestException('Invalid date.');
    const searchPattern = search ? `%${search.replace(/[!%_]/g, '!$&')}%` : '';
    return { page, limit, params: [searchPattern, date || null, module === 'ALL' ? '' : module,
      role === 'ALL' ? '' : role, filters.archived === 'true'] as unknown[] };
  }

  private normalize(row: OperationalRow) {
    const before = cleanChanges(row.old_values), after = cleanChanges(row.new_values);
    const details = [
      entityDescription(row),
      ...displayChanges(before, after),
      row.quantity_change != null ? `Stock movement: ${row.quantity_change > 0 ? '+' : ''}${row.quantity_change} units` : '',
      row.reason ? `Reason: ${row.reason}` : '',
    ].filter(Boolean).join('\n') || 'No additional details recorded';
    return {
      id: `${row.source}:${row.source_id}`,
      source: row.source, sourceId: row.source_id,
      createdAt: row.occurred_at, module: row.module, action: row.action,
      event: eventName(row.action), actorId: row.actor_id, userName: row.actor_name,
      userRole: row.actor_role, details,
      status: 'RECORDED', isArchived: Boolean(row.archived_at),
    };
  }

  async list(filters: Filters) {
    const { page, limit, params } = this.parameters(filters);
    const [count, records] = await Promise.all([
      this.pool.query<{ total: string }>(`${this.rowsSql} SELECT COUNT(*)::text AS total FROM filtered`, params),
      this.pool.query<OperationalRow>(`${this.rowsSql} SELECT * FROM filtered ORDER BY occurred_at DESC, source_id DESC, source DESC LIMIT $6 OFFSET $7`,
        [...params, limit, (page - 1) * limit]),
    ]);
    const total = Number(count.rows[0]?.total ?? 0);
    return { success: true, data: records.rows.map(row => this.normalize(row)),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      roleNote: 'Actor roles are current database roles; historical role snapshots were not recorded.' };
  }

  async exportCsv(filters: Filters) {
    const { params } = this.parameters({ ...filters, page: '1', limit: '8' });
    const count = await this.pool.query<{ total: string }>(`${this.rowsSql} SELECT COUNT(*)::text AS total FROM filtered`, params);
    if (Number(count.rows[0]?.total ?? 0) > 5000) {
      throw new BadRequestException('More than 5,000 records match. Narrow the filters to export all matching records.');
    }
    const rows = await this.pool.query<OperationalRow>(
      `${this.rowsSql} SELECT * FROM filtered ORDER BY occurred_at DESC, source_id DESC, source DESC`, params);
    const headers = ['Date (ISO)', 'Source', 'Module', 'Event', 'Actor', 'Current Role', 'Details', 'Status', 'Archived'];
    const lines = [headers.map(escapeCsv).join(',')];
    for (const raw of rows.rows) {
      const row = this.normalize(raw);
      lines.push([row.createdAt, row.source, row.module, row.event, row.userName,
        row.userRole, row.details, row.status, row.isArchived].map(escapeCsv).join(','));
    }
    return `\uFEFF${lines.join('\r\n')}\r\n`;
  }

  async setArchived(source: string, sourceId: string, archived: boolean, actorId: number) {
    if (!['audit', 'inventory'].includes(source) || !/^[1-9]\d{0,17}$/.test(sourceId)) {
      throw new BadRequestException('Invalid log identifier.');
    }
    const table = source === 'audit' ? 'audit_logs' : 'inventory_movements';
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const exists = await client.query(`SELECT 1 FROM public.${table} WHERE id=$1 LIMIT 1`, [sourceId]);
      if (!exists.rowCount) throw new NotFoundException('Log entry not found.');
      if (archived) {
        await client.query(`INSERT INTO public.superadmin_log_archives(source, source_id, archived_by)
          VALUES ($1,$2,$3) ON CONFLICT(source,source_id) DO NOTHING`, [source, sourceId, actorId]);
      } else {
        await client.query('DELETE FROM public.superadmin_log_archives WHERE source=$1 AND source_id=$2', [source, sourceId]);
      }
      await client.query(`INSERT INTO public.audit_logs(actor_id,action,entity_type,entity_id,reason)
        VALUES ($1,$2,'OPERATIONAL_LOG',$3,$4)`, [actorId,
          archived ? 'OP_LOG_ARCHIVED' : 'OP_LOG_RESTORED', `${source}:${sourceId}`,
          'Superadmin log register visibility change']);
      await client.query('COMMIT');
      return { success: true, message: archived ? 'Log archived; original evidence retained.' : 'Log restored.' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally { client.release(); }
  }
}
