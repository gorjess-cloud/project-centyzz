import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { db } from '../../prisma/db.js';

@Injectable()
export class PromosService {
  private readonly logger = new Logger(PromosService.name);

  // 1. Get Active Promo Banner
  async getActivePromo() {
    try {
      const promos: any[] = await db.orm.public.Promo.where({}).all();
      if (!promos || promos.length === 0) {
        return null;
      }
      const p = promos.find(item => item.isActive ?? item.is_active);
      if (!p) return null;
      return {
        id: p.id,
        title: p.code || 'SPECIAL PROMO',
        appliesTo: p.description || 'All Services',
        discountText: (p.discountType || p.discount_type) === 'PERCENTAGE' ? `${p.discountValue || p.discount_value}% off` : `₱${p.discountValue || p.discount_value} off`,
        discountType: p.discountType || p.discount_type,
        discountValue: p.discountValue || p.discount_value,
        startDate: (p.startsAt || p.starts_at) ? String(p.startsAt || p.starts_at).split('T')[0] : '',
        endDate: (p.expiresAt || p.expires_at) ? String(p.expiresAt || p.expires_at).split('T')[0] : '',
        status: 'ACTIVE',
      };
    } catch (error) {
      this.logger.error('Error fetching promo:', error);
      throw error;
    }
  }

  // 2. Create or Update Promo
  async savePromo(dto: any) {
    if (!dto.title || !dto.value) {
      throw new BadRequestException('Promo title and discount value are required.');
    }

    const existingPromos: any[] = await db.orm.public.Promo.where({}).all();
    const existing = existingPromos && existingPromos.length > 0 ? existingPromos[0] : null;

    const discountType = dto.discountType === '% Off' ? 'PERCENTAGE' : 'FIXED';
    const discountValue = parseFloat(String(dto.value).replace(/[^\d.]/g, '')) || 0;

    const payload: any = {
      code: dto.title.toUpperCase().trim(),
      description: dto.appliesTo ? dto.appliesTo.trim() : 'Promo Discount',
      discountType,
      discountValue,
      minPurchase: '0.00',
      startsAt: dto.startDate ? new Date(dto.startDate).toISOString() : null,
      expiresAt: dto.endDate ? new Date(dto.endDate).toISOString() : null,
      isActive: true,
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      return await db.orm.public.Promo.where({ id: existing.id }).update(payload);
    } else {
      payload.usageLimit = 100;
      payload.usageCount = 0;
      payload.createdAt = new Date().toISOString();
      return await db.orm.public.Promo.create(payload);
    }
  }
}