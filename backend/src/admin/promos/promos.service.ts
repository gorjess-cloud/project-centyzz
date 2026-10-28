import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  OnModuleDestroy,
} from '@nestjs/common';
import { Pool } from 'pg';
import { amount, cents, reportDate } from '../reports/report-math.js';
import { scopeMatches } from '../../staff/pos/pos-discount-rules.js';
const localDate = (value: any) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
export function promoInput(dto: any) {
  const code = String(dto?.title ?? '')
      .trim()
      .toUpperCase(),
    scope = String(dto?.appliesTo ?? '').trim();
  if (!/^[A-Z0-9][A-Z0-9 _-]{0,49}$/.test(code))
    throw new BadRequestException(
      'Enter a promo code of 1–50 letters, numbers, spaces, hyphens or underscores.',
    );
  if (!scope || scope.length > 200)
    throw new BadRequestException(
      'Choose the services or category this promo applies to.',
    );
  if (!['% Off', '₱ Off'].includes(dto.discountType))
    throw new BadRequestException('Choose percentage or fixed discount.');
  const value = cents(dto.value),
    minimum = cents(dto.minPurchase ?? '0.00');
  if (
    value <= 0 ||
    value > 100000000 ||
    (dto.discountType === '% Off' && value >= 10000) ||
    minimum < 0 ||
    minimum > 100000000
  )
    throw new BadRequestException(
      'Use a positive discount below 100% and a valid minimum purchase.',
    );
  const start = reportDate(dto.startDate),
    end = reportDate(dto.endDate);
  if (start > end)
    throw new BadRequestException(
      'End date must be on or after the start date.',
    );
  const limit =
    dto.usageLimit === '' ||
    dto.usageLimit === null ||
    dto.usageLimit === undefined
      ? null
      : Number(dto.usageLimit);
  if (
    limit !== null &&
    (!Number.isSafeInteger(limit) || limit < 1 || limit > 2147483647)
  )
    throw new BadRequestException(
      'Usage limit must be a positive whole number, or leave it blank for unlimited.',
    );
  if (dto.isActive !== undefined && typeof dto.isActive !== 'boolean')
    throw new BadRequestException('Choose a valid promo status.');
  return {
    code,
    scope,
    type: dto.discountType === '% Off' ? 'PERCENTAGE' : 'FIXED',
    value: amount(value),
    minimum: amount(minimum),
    limit,
    active: dto.isActive ?? true,
    start: new Date(start + 'T00:00:00+08:00').toISOString(),
    end: new Date(Date.parse(end + 'T00:00:00+08:00') + 86400000).toISOString(),
  };
}
@Injectable()
export class PromosService implements OnModuleDestroy {
  readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 4,
    connectionTimeoutMillis: 10000,
  });
  onModuleDestroy() {
    return this.pool.end();
  }
  private display(row: any) {
    const now = Date.now(),
      status = !row.is_active
        ? 'INACTIVE'
        : row.starts_at && new Date(row.starts_at).valueOf() > now
          ? 'UPCOMING'
          : row.expires_at && new Date(row.expires_at).valueOf() <= now
            ? 'EXPIRED'
            : row.usage_limit !== null && row.usage_count >= row.usage_limit
              ? 'USED UP'
              : 'ACTIVE';
    return {
      id: row.id,
      title: row.code,
      appliesTo: row.description,
      discountType: row.discount_type,
      discountValue: Number(row.discount_value),
      discountText:
        row.discount_type === 'PERCENTAGE'
          ? row.discount_value + '% off'
          : '₱' + row.discount_value + ' off',
      startDate: row.starts_at ? localDate(row.starts_at) : '',
      endDate: row.expires_at
        ? localDate(new Date(row.expires_at).valueOf() - 1)
        : '',
      minPurchase: Number(row.min_purchase),
      usageLimit: row.usage_limit,
      usageCount: row.usage_count,
      isActive: row.is_active,
      status,
      revision: row.updated_at,
    };
  }
  async list() {
    return (
      await this.pool.query(
        'SELECT * FROM public.promos WHERE archived_at IS NULL ORDER BY created_at DESC,id DESC',
      )
    ).rows.map((row) => this.display(row));
  }
  async getActivePromo() {
    return (await this.list()).find((row) => row.status === 'ACTIVE') ?? null;
  }
  private async save(dto: any, id?: number) {
    const input = promoInput(dto),
      c = await this.pool.connect();
    try {
      await c.query('BEGIN');
      if (id !== undefined) {
        const current = (
          await c.query(
            'SELECT id,usage_count,updated_at::text FROM public.promos WHERE id=$1 AND archived_at IS NULL FOR UPDATE',
            [id],
          )
        ).rows[0];
        if (!current) throw new NotFoundException('Promo not found.');
        if (
          dto.revision &&
          new Date(dto.revision).valueOf() !==
            new Date(current.updated_at).valueOf()
        )
          throw new ConflictException(
            'This promo changed. Close the form and reopen it before saving.',
          );
        if (input.limit !== null && input.limit < current.usage_count)
          throw new BadRequestException(
            'Usage limit cannot be lower than the redemptions already recorded.',
          );
      }
      const catalog = (
        await c.query(
          'SELECT s.name,c.name AS category_name FROM public.services s LEFT JOIN public.service_categories c ON c.id=s.category_id WHERE s.is_active AND s.archived_at IS NULL',
        )
      ).rows;
      if (
        !catalog.some((row) =>
          scopeMatches(input.scope, {
            name: row.name,
            categoryName: row.category_name,
          }),
        )
      )
        throw new BadRequestException(
          'Choose All Services, an existing service, or an existing category.',
        );
      const duplicate = await c.query(
        'SELECT id FROM public.promos WHERE upper(btrim(code))=$1 AND ($2::int IS NULL OR id<>$2)',
        [input.code, id ?? null],
      );
      if (duplicate.rowCount)
        throw new ConflictException(
          'That promo code already exists. Choose another code.',
        );
      const params = [
        input.code,
        input.scope,
        input.type,
        input.value,
        input.minimum,
        input.start,
        input.end,
        input.limit,
        input.active,
      ];
      const saved =
        id === undefined
          ? (
              await c.query(
                'INSERT INTO public.promos(code,description,discount_type,discount_value,min_purchase,starts_at,expires_at,usage_limit,is_active,usage_count,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,0,now(),now()) RETURNING *',
                params,
              )
            ).rows[0]
          : (
              await c.query(
                'UPDATE public.promos SET code=$1,description=$2,discount_type=$3,discount_value=$4,min_purchase=$5,starts_at=$6,expires_at=$7,usage_limit=$8,is_active=$9,updated_at=now() WHERE id=$10 RETURNING *',
                [...params, id],
              )
            ).rows[0];
      await c.query('COMMIT');
      return this.display(saved);
    } catch (error) {
      await c.query('ROLLBACK');
      if ((error as any)?.code === '23505')
        throw new ConflictException('That promo code already exists.');
      throw error;
    } finally {
      c.release();
    }
  }
  async savePromo(dto: any) {
    return this.save(dto);
  }
  async updatePromo(id: number, dto: any) {
    return this.save(dto, id);
  }
}
