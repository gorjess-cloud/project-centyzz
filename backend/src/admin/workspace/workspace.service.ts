import {ReportsService} from '../reports/reports.service.js';
import {
  BadRequestException,
  Injectable,
  OnModuleDestroy,
} from '@nestjs/common';
import { Pool } from 'pg';
import { SalonConfigService } from '../../salon/salon-config.service.js';
const PH = 'Asia/Manila';
export const manilaDate = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: PH,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
export function dashboardDate(date: string) {
  if (
    !/^20\d{2}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date + 'T00:00:00Z')) ||
    new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) !== date
  )
    throw new BadRequestException('Choose a valid dashboard date.');
  return date;
}
@Injectable()
export class WorkspaceService implements OnModuleDestroy {
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 10000,
    query_timeout: 10000,
  });
  constructor(private readonly config: SalonConfigService,private readonly reports:ReportsService) {}
  onModuleDestroy() {
    return this.pool.end();
  }
  async dashboard(input?: string) {
    const date = dashboardDate(input || manilaDate()),
      d = new Date(date + 'T00:00:00Z'),
      yesterday = new Date(d.valueOf() - 86400000).toISOString().slice(0, 10);
    const monthStart = date.slice(0, 7) + '-01',
      monthEnd = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0))
        .toISOString()
        .slice(0, 10);
    const [
      counts,
      appointments,
      categories,
      calendar,
      shifts,
      attention,
      settings,
    ] = await Promise.all([
      this.pool.query(
        `SELECT
        (SELECT count(*)::int FROM public.appointments WHERE appointment_date=$1 AND archived_at IS NULL AND status IN ('PENDING','CONFIRMED','COMPLETED','NO_SHOW')) AS bookings,
        (SELECT count(*)::int FROM public.appointments WHERE appointment_date=$1 AND archived_at IS NULL AND status='PENDING') AS pending,
        (SELECT count(*)::int FROM public.clients WHERE archived_at IS NULL AND coalesce(is_active,true)) AS clients,
        (SELECT count(*)::int FROM public."user" u LEFT JOIN public.staff st ON st.user_id=u.id WHERE u.role='STAFF' AND u."isActive" AND u.archived_at IS NULL AND st.archived_at IS NULL AND st.roster_hidden_at IS NULL AND coalesce(st.is_active,true)) AS staff`,
        [date],
      ),
      this.pool.query(
        `SELECT a.id,a.customer_name AS client,coalesce(bundle.names,s.name) AS service,a.start_time::text AS time,a.status,
        coalesce(nullif(concat_ws(' ',u."firstName",u."lastName"),''),'Unassigned') AS staff
        FROM public.appointments a LEFT JOIN public.services s ON s.id=a.service_id LEFT JOIN public.appointment_service_summary bundle ON bundle.appointment_id=a.id LEFT JOIN public.staff st ON st.id=a.staff_id LEFT JOIN public."user" u ON u.id=st.user_id
        WHERE a.appointment_date=$1 AND a.archived_at IS NULL AND a.status IN ('PENDING','CONFIRMED','COMPLETED','NO_SHOW') ORDER BY a.start_time,a.id LIMIT 5`,
        [date],
      ),
      this.pool.query(
        `SELECT c.id,c.name,count(DISTINCT a.id) FILTER(WHERE a.appointment_date=$1 AND a.archived_at IS NULL AND a.status IN ('PENDING','CONFIRMED','COMPLETED'))::int AS bookings
        FROM public.service_categories c LEFT JOIN public.services s ON s.category_id=c.id LEFT JOIN public.appointments a ON (EXISTS(SELECT 1 FROM public.appointment_services lines WHERE lines.appointment_id=a.id AND lines.service_id=s.id) OR (a.service_id=s.id AND NOT EXISTS(SELECT 1 FROM public.appointment_services lines WHERE lines.appointment_id=a.id)))
        WHERE c.archived_at IS NULL AND c.is_active GROUP BY c.id,c.name ORDER BY c.id LIMIT 3`,
        [date],
      ),
      this.pool.query(
        `SELECT appointment_date AS date,count(*)::int AS count FROM public.appointments WHERE appointment_date BETWEEN $1 AND $2 AND archived_at IS NULL AND status IN ('PENDING','CONFIRMED','COMPLETED') GROUP BY appointment_date`,
        [monthStart, monthEnd],
      ),
      this.pool.query(
        `SELECT ss.id,concat_ws(' ',u."firstName",u."lastName") AS name,
        to_char(ss.starts_at AT TIME ZONE 'Asia/Manila','HH24:MI') AS start,to_char(ss.ends_at AT TIME ZONE 'Asia/Manila','HH24:MI') AS "end"
        FROM public.staff_schedules ss JOIN public.staff st ON st.id=ss.staff_id JOIN public."user" u ON u.id=st.user_id
        WHERE ss.archived_at IS NULL AND ss.status<>'CANCELLED' AND (ss.starts_at AT TIME ZONE 'Asia/Manila')::date=$1::date ORDER BY ss.starts_at LIMIT 5`,
        [date],
      ),
      this.pool.query(
        `SELECT
        (SELECT count(*)::int FROM public.appointments WHERE archived_at IS NULL AND status='PENDING' AND appointment_date >= $1) AS pending,
        (SELECT count(*)::int FROM public.appointments WHERE archived_at IS NULL AND staff_id IS NULL AND status IN ('PENDING','CONFIRMED') AND appointment_date >= $1) AS unassigned,
        (SELECT count(*)::int FROM public.products p JOIN public.inventory i ON i.product_id=p.id WHERE p.archived_at IS NULL AND p.inventory_hidden_at IS NULL AND p.is_active AND i.quantity_on_hand<=i.reorder_threshold) AS low_stock`,
        [manilaDate()],
      ),
      this.config.get(),
    ]);
    const {revenue,previousRevenue}=await this.reports.revenueForDates(date,yesterday);
    return {
      date,
      updatedAt: new Date().toISOString(),
      stats: { ...counts.rows[0], revenue, previousRevenue },
      appointments: appointments.rows,
      categories: categories.rows,
      calendar: calendar.rows,
      shifts: shifts.rows,
      inventoryAlertsEnabled: settings.inventory.alertsEnabled,
      attention: {
        pending: attention.rows[0].pending,
        unassigned: attention.rows[0].unassigned,
        lowStock: attention.rows[0].low_stock,
      },
    };
  }
  async staffSummary() {
    return (
      await this.pool
        .query(`SELECT u.id,concat_ws(' ',u."firstName",u."lastName") AS name,u.role,u."isActive" AS active,st.job_title
    FROM public."user" u LEFT JOIN public.staff st ON st.user_id=u.id WHERE u.role IN ('ADMIN','STAFF') AND u.archived_at IS NULL ORDER BY u.role,u."firstName"`)
    ).rows;
  }
  async activity(actorId: number) {
    return (
      await this.pool.query(
        `SELECT id,event,module,status,occurred_at FROM public.operational_logs WHERE actor_user_id=$1 AND hidden_at IS NULL ORDER BY occurred_at DESC,id DESC LIMIT 50`,
        [actorId],
      )
    ).rows;
  }
  async database() {
    const tables = [
      ['Accounts', '"user"'],
      ['Staff', 'staff'],
      ['Clients', 'clients'],
      ['Services', 'services'],
      ['Appointments', 'appointments'],
      ['Inventory items', 'products'],
      ['Stock movements', 'inventory_movements'],
      ['Transactions', 'transactions'],
      ['Activity logs', 'operational_logs'],
    ];
    const result = await Promise.all(
      tables.map(async ([label, table]) => ({
        label,
        rows: (
          await this.pool.query(
            `SELECT count(*)::int AS count FROM public.${table}`,
          )
        ).rows[0].count,
      })),
    );
    return {
      connected: true,
      checkedAt: new Date().toISOString(),
      tables: result,
    };
  }
}
