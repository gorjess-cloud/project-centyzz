import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleDestroy,
} from '@nestjs/common';
import pg from 'pg';

/** Public catalog must respect both service active status and archive status. */
@Injectable()
export class ServicesService implements OnModuleDestroy {
  private readonly logger = new Logger(ServicesService.name);
  private readonly pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }

  async findAllGroupedByCategory() {
    try {
      const result = await this.pool.query(`
        SELECT sc.id AS category_id, sc.name AS category_name,
               s.id AS service_id, s.name AS service_name,
               s.description, s.price, s.duration_minutes
        FROM public.service_categories sc
        JOIN public.services s ON s.category_id = sc.id
        WHERE sc.is_active = TRUE
          AND s.is_active = TRUE
          AND s.archived_at IS NULL
        ORDER BY sc.id, s.id
      `);
      const groups = new Map<number, {
        id: number;
        category: string;
        services: { id: number; name: string; description: string | null; price: number; durationMinutes: number }[];
      }>();
      for (const row of result.rows) {
        if (!groups.has(row.category_id)) {
          groups.set(row.category_id, { id: row.category_id, category: row.category_name, services: [] });
        }
        groups.get(row.category_id)!.services.push({
          id: row.service_id,
          name: row.service_name,
          description: row.description,
          price: Number(row.price),
          durationMinutes: Number(row.duration_minutes),
        });
      }
      return [...groups.values()];
    } catch (error) {
      this.logger.error('Failed to fetch the public service catalog', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Unable to retrieve the service catalog');
    }
  }
}
