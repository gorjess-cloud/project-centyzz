import { BadRequestException, Injectable, OnModuleDestroy } from '@nestjs/common';
import pg from 'pg';

export type MaintenanceUpdate = { enabled?: unknown; message?: unknown; duration?: unknown };

type MaintenanceRecord = {
  enabled: boolean;
  message: string;
  duration: string;
  updated_at: Date | null;
  updated_by: number | null;
};

const DURATIONS = ['30 minutes', '1 hour', '2 hours', '4 hours'];

@Injectable()
export class SuperadminSettingsService implements OnModuleDestroy {
  private readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  async onModuleDestroy() { await this.pool.end(); }

  private format(row: MaintenanceRecord) {
    return {
      enabled: row.enabled,
      message: row.message,
      duration: row.duration,
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
      updatedBy: row.updated_by,
      enforcementActive: true,
    };
  }

  // Shared single-source maintenance status, cached briefly to avoid a DB query for every API request.
  private lastPublicRead = 0;
  private publicCache: { enabled: boolean; message: string; duration: string } | null = null;

  async getPublicMaintenance(): Promise<{ enabled: boolean; message: string; duration: string }> {
    if (this.publicCache && Date.now() - this.lastPublicRead < 2500) return this.publicCache;
    const result = await this.pool.query<Pick<MaintenanceRecord, 'enabled' | 'message' | 'duration'>>(
      'SELECT enabled, message, duration FROM public.superadmin_maintenance_settings WHERE id = 1',
    );
    if (!result.rows[0]) throw new BadRequestException('Maintenance configuration is missing');
    this.publicCache = result.rows[0];
    this.lastPublicRead = Date.now();
    return result.rows[0];
  }

  async getMaintenance() {
    const result = await this.pool.query<MaintenanceRecord>(
      `SELECT enabled, message, duration, updated_at, updated_by
       FROM public.superadmin_maintenance_settings WHERE id = 1`,
    );
    if (!result.rows[0]) throw new BadRequestException('Maintenance settings must be initialized with the supplied SQL.');
    return { success: true, data: this.format(result.rows[0]) };
  }

  async saveMaintenance(body: MaintenanceUpdate, actorId: number) {
    if (typeof body?.enabled !== 'boolean' || typeof body?.message !== 'string' ||
        body.message.trim().length === 0 || body.message.trim().length > 200 ||
        typeof body.duration !== 'string' || !DURATIONS.includes(body.duration)) {
      throw new BadRequestException('Provide enabled, a message (1–200 characters), and an allowed duration.');
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const before = await client.query<MaintenanceRecord>(
        `SELECT enabled, message, duration, updated_at, updated_by
         FROM public.superadmin_maintenance_settings WHERE id = 1 FOR UPDATE`,
      );
      if (!before.rows[0]) throw new BadRequestException('Maintenance settings have not been initialized.');
      const changed = before.rows[0].enabled !== body.enabled ||
        before.rows[0].message !== body.message.trim() ||
        before.rows[0].duration !== body.duration;
      let saved = before.rows[0];
      if (changed) {
        const updated = await client.query<MaintenanceRecord>(
          `UPDATE public.superadmin_maintenance_settings
           SET enabled=$1, message=$2, duration=$3, updated_by=$4, updated_at=NOW()
           WHERE id=1 RETURNING enabled, message, duration, updated_at, updated_by`,
          [body.enabled, body.message.trim(), body.duration, actorId],
        );
        saved = updated.rows[0];
        // Audit what was actually changed, not the PIN or any credentials.
        await client.query(
          `INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, old_values, new_values, reason)
           VALUES ($1, 'MAINTENANCE_CONFIGURATION_UPDATED', 'SYSTEM_SETTINGS', 'maintenance', $2::jsonb, $3::jsonb, $4)`,
          [actorId,
            JSON.stringify({ enabled: before.rows[0].enabled, message: before.rows[0].message, duration: before.rows[0].duration }),
            JSON.stringify({ enabled: saved.enabled, message: saved.message, duration: saved.duration }),
            'Superadmin maintenance configuration updated'],
        );
      }
      await client.query('COMMIT');
      this.publicCache = null;
      this.lastPublicRead = 0;
      return { success: true, changed, data: this.format(saved) };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
