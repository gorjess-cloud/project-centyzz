import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import pg from 'pg';

/** Admin service management uses the same numeric services table as booking. */
@Injectable()
export class ServicesService implements OnModuleDestroy {
  private readonly logger = new Logger(ServicesService.name);
  private readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  private async query(sql: string, params: unknown[] = []): Promise<any[]> {
    const result = await this.pool.query(sql, params);
    return result.rows;
  }

  private formattedService(s: any) {
    const minutes = Number(s.duration_minutes || 0);
    const hours = Math.floor(minutes / 60);
    const remainder = minutes % 60;
    const duration = hours ? `${hours} hr${hours > 1 ? 's' : ''}${remainder ? ` ${remainder} mins` : ''}` : `${minutes} mins`;
    const amount = Number(s.price || 0);
    return {
      id: s.id,
      category: String(s.category_name || '').toUpperCase(),
      categoryId: s.category_id ?? null,
      categoryName: s.category_name || 'Uncategorized',
      name: s.name,
      duration,
      durationMinutes: minutes,
      price: `₱${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      status: s.is_active ? 'ACTIVE' : 'INACTIVE',
      isArchived: s.archived_at != null,
      description: s.description || '',
      dateCreated: s.created_at
        ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'N/A',
    };
  }

  private async serviceById(id: number) {
    const rows = await this.query('SELECT id, category_id FROM public.services WHERE id=$1', [id]);
    if (!rows.length) throw new NotFoundException('Service not found.');
    return rows[0];
  }

  async getCategories() {
    const rows = await this.query('SELECT id, name, is_active, archived_at FROM public.service_categories ORDER BY id');
    return rows.map(row => ({ id: row.id, name: row.name, isActive: row.is_active, isArchived: row.archived_at != null }));
  }

  private async categoryId(name: unknown, id?: unknown, currentId?: number): Promise<number> {
    const category = String(name || '').trim();
    const hasId = id !== undefined && id !== null && id !== '';
    if (hasId && (!/^\d+$/.test(String(id)) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0)) {
      throw new BadRequestException('Choose a valid service category.');
    }
    if (!hasId && !category) throw new BadRequestException('Service category is required.');
    const rows = await this.query(
      hasId ? 'SELECT id, is_active, archived_at FROM public.service_categories WHERE id=$1'
        : 'SELECT id, is_active, archived_at FROM public.service_categories WHERE UPPER(TRIM(name))=UPPER($1) ORDER BY id LIMIT 1',
      [hasId ? Number(id) : category],
    );
    if (!rows.length) throw new BadRequestException('The selected service category does not exist.');
    const row = rows[0];
    // Retain an existing assignment while editing; new assignments require an available category.
    if ((!row.is_active || row.archived_at != null) && row.id !== currentId) {
      throw new BadRequestException('Choose an active, unarchived service category.');
    }
    return row.id;
  }

  private price(value: unknown): number {
    const cleaned = String(value ?? '').replace(/[₱,\s]/g, '');
    if (!/^\d+(\.\d{1,2})?$/.test(cleaned) || Number(cleaned) <= 0 || !Number.isFinite(Number(cleaned))) {
      throw new BadRequestException('Service price must be a positive amount with at most two decimal places.');
    }
    return Number(cleaned);
  }

  private duration(dto: any): number {
    const hours = Number(dto.durationHours ?? 0);
    const minutes = Number(dto.durationMins ?? 0);
    if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || minutes < 0 || minutes > 59 || hours * 60 + minutes <= 0) {
      throw new BadRequestException('Service duration must be greater than zero and use valid hours/minutes.');
    }
    return hours * 60 + minutes;
  }

  async getServices(isArchived = false) {
    try {
      const rows = await this.query(
        `SELECT s.*, sc.name AS category_name FROM public.services s
         LEFT JOIN public.service_categories sc ON sc.id = s.category_id
         WHERE ${isArchived ? 's.archived_at IS NOT NULL' : 's.archived_at IS NULL'}
         ORDER BY s.id ASC`,
      );
      return rows.map((row) => this.formattedService(row));
    } catch (error) {
      this.logger.error('Failed to load admin services', error instanceof Error ? error.stack : String(error));
      throw error; // Never display a database failure as an empty service catalog.
    }
  }

  async createService(dto: any) {
    const name = String(dto?.name || '').trim();
    if (!name || name.length > 150) throw new BadRequestException('Service name must be 1–150 characters.');
    const categoryId = await this.categoryId(dto?.category, dto?.categoryId);
    const price = this.price(dto?.price);
    const duration = this.duration(dto || {});
    try {
      const rows = await this.query(
        `INSERT INTO public.services (category_id, name, description, price, duration_minutes, is_active, created_at, updated_at)
         VALUES ($1,$2,$3,$4,$5,true,NOW(),NOW()) RETURNING *`,
        [categoryId, name, String(dto?.description || '').trim() || null, price, duration],
      );
      return rows[0];
    } catch (error: any) {
      if (error?.code === '23505') throw new BadRequestException('A service with this name already exists.');
      throw error;
    }
  }

  async updateService(id: number, dto: any) {
    const existing = await this.serviceById(id);
    const name = String(dto?.name || '').trim();
    if (!name || name.length > 150) throw new BadRequestException('Service name must be 1–150 characters.');
    const categoryId = await this.categoryId(dto?.category, dto?.categoryId, existing.category_id);
    const price = this.price(dto?.price);
    const duration = this.duration(dto || {});
    try {
      const rows = await this.query(
        `UPDATE public.services SET category_id=$1, name=$2, description=$3,
         price=$4, duration_minutes=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
        [categoryId, name, String(dto?.description || '').trim() || null, price, duration, id],
      );
      return rows[0];
    } catch (error: any) {
      if (error?.code === '23505') throw new BadRequestException('A service with this name already exists.');
      throw error;
    }
  }

  async toggleServiceStatus(id: number) {
    const rows = await this.query(
      'UPDATE public.services SET is_active=NOT is_active, updated_at=NOW() WHERE id=$1 AND archived_at IS NULL RETURNING *',
      [id],
    );
    if (!rows.length) throw new NotFoundException('Active service not found.');
    return rows[0];
  }

  async toggleServiceArchive(id: number) {
    const rows = await this.query(
      `UPDATE public.services SET archived_at=CASE WHEN archived_at IS NULL THEN NOW() ELSE NULL END,
       updated_at=NOW() WHERE id=$1 RETURNING *`,
      [id],
    );
    if (!rows.length) throw new NotFoundException('Service not found.');
    return rows[0];
  }
}
