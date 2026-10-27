import { createHash } from 'node:crypto';
import { Injectable, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';

export type RecordOperationalEvent = {
  module: string;
  event: string;
  userName: string;
  userRole: string;
  details?: string;
  status?: string;
  actorUserId?: number | null;
};

@Injectable()
export class OperationalLogsService implements OnModuleDestroy {
  private readonly pool: Pool;

  constructor() {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5, connectionTimeoutMillis: 5000, query_timeout: 5000 });
  }

  onModuleDestroy() { return this.pool.end(); }

  private format(row: any) {
    const date = new Date(row.occurred_at);
    return {
      id: String(row.id),
      date: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date),
      displayDate: new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: 'long', day: 'numeric' }).format(date),
      time: new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit', hour12: true }).format(date),
      module: row.module,
      event: row.event,
      userName: row.user_name,
      userRole: row.user_role,
      details: row.details,
      status: row.status,
      isArchived: row.archived_at != null,
    };
  }

  async list(archived = false, adminOnly = false) {
    const rows = await this.pool.query(
      `SELECT * FROM public.operational_logs
       WHERE hidden_at IS NULL AND (archived_at IS NOT NULL) = $1
       AND (NOT $2::boolean OR user_role IN ('ADMIN', 'STAFF'))
       ORDER BY occurred_at DESC, id DESC LIMIT 5000`, [archived, adminOnly],
    );
    return rows.rows.map(row => this.format(row));
  }


  // Authenticated server-side session events only. Never store the token itself.
  async recordSession(actorId: number, event: 'Signed In' | 'Signed Out', accessToken: string) {
    const key = createHash('sha256').update(event + ':' + accessToken).digest('hex');
    const result = await this.pool.query(
      `INSERT INTO public.operational_logs
       (module, event, actor_user_id, user_name, user_role, details, status, session_event_key)
       SELECT 'Authentication & Access', $2::text, u.id,
         COALESCE(NULLIF(btrim(concat_ws(' ', u."firstName", u."lastName")), ''), 'User #' || u.id),
         u.role, 'Authenticated session ' || CASE WHEN $2::text = 'Signed In' THEN 'started' ELSE 'ended' END,
         'Logged', $3
       FROM public."user" u WHERE u.id = $1 AND u.role IN ('ADMIN', 'STAFF')
       ON CONFLICT (session_event_key) DO NOTHING RETURNING id`, [actorId, event, key],
    );
    return { recorded: Boolean(result.rowCount) };
  }

  // Call this only from trusted backend business operations, never from an arbitrary frontend payload.
  async record(input: RecordOperationalEvent) {
    const result = await this.pool.query(
      `INSERT INTO public.operational_logs
       (module, event, actor_user_id, user_name, user_role, details, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [input.module, input.event, input.actorUserId ?? null, input.userName,
       input.userRole, input.details ?? '', input.status ?? 'Logged'],
    );
    return this.format(result.rows[0]);
  }

  async archive(id: string, actorId: number | null, adminOnly = false) {
    const result = await this.pool.query(
      `UPDATE public.operational_logs SET archived_at = now(), archived_by = $2
       WHERE id = $1 AND archived_at IS NULL AND hidden_at IS NULL
       AND (NOT $3::boolean OR user_role IN ('ADMIN', 'STAFF')) RETURNING *`, [id, actorId, adminOnly],
    );
    if (!result.rowCount) throw new NotFoundException('Active log not found');
    return this.format(result.rows[0]);
  }

  async restore(id: string, adminOnly = false) {
    const result = await this.pool.query(
      `UPDATE public.operational_logs SET archived_at = NULL, archived_by = NULL
       WHERE id = $1 AND archived_at IS NOT NULL AND hidden_at IS NULL
       AND (NOT $2::boolean OR user_role IN ('ADMIN', 'STAFF')) RETURNING *`, [id, adminOnly],
    );
    if (!result.rowCount) throw new NotFoundException('Archived log not found');
    return this.format(result.rows[0]);
  }

  // Audit events must remain recoverable: 'delete' is a soft-hide operation.
  async hide(id: string, actorId: number | null, adminOnly = false) {
    const result = await this.pool.query(
      `UPDATE public.operational_logs SET hidden_at = now(), hidden_by = $2
       WHERE id = $1 AND archived_at IS NOT NULL AND hidden_at IS NULL
       AND (NOT $3::boolean OR user_role IN ('ADMIN', 'STAFF')) RETURNING id`, [id, actorId, adminOnly],
    );
    if (!result.rowCount) throw new NotFoundException('Archived log not found');
    return { success: true };
  }
}
