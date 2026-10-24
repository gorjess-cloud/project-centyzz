import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { db } from '../prisma/db.js';
import type { Varchar } from '@prisma/orm-postgres/target/codec-types';

@Injectable()
export class PromosService {
  private readonly logger = new Logger(PromosService.name);

  async findActivePromos() {
    try {
      const promos = await db.orm.public.Promo.where({ isActive: true }).all();
      const now = Date.now();
      return promos.filter((promo) =>
        (!promo.startsAt || new Date(promo.startsAt).getTime() <= now) &&
        (!promo.expiresAt || new Date(promo.expiresAt).getTime() > now) &&
        (promo.usageLimit === null || promo.usageCount < promo.usageLimit),
      ).map((promo) => ({
        id: promo.id,
        code: promo.code,
        title: promo.code,
        description: promo.description || '',
        discountType: promo.discountType,
        discountValue: Number(promo.discountValue),
        minPurchase: Number(promo.minPurchase),
        expiresAt: promo.expiresAt,
      }));
    } catch (error) {
      this.logger.error('Failed to fetch active promos', error instanceof Error ? error.stack : String(error));
      throw new InternalServerErrorException('Unable to retrieve active promos.');
    }
  }

  async validatePromo(promoCode: string) {
    const code = promoCode?.trim().toUpperCase();

    if (!code) {
    return {
        valid: false,
        message: 'Please enter a promo code.',
    };
    }

    const typedCode = code as Varchar<50>;

    try {
      const promos = await db.orm.public.Promo
        .where({ code: typedCode })
        .all();

      if (promos.length === 0) {
        return {
          valid: false,
          message: 'Promo code not found.',
        };
      }

      const promo = promos[0];
      const now = Date.now();

      if (!promo.isActive) {
        return {
          valid: false,
          message: 'This promo code is inactive.',
        };
      }

      if (promo.startsAt && new Date(promo.startsAt).getTime() > now) {
        return {
          valid: false,
          message: 'This promo code is not active yet.',
        };
      }

      if (promo.expiresAt && new Date(promo.expiresAt).getTime() <= now) {
        return {
          valid: false,
          message: 'This promo code has expired.',
        };
      }

      if (
        promo.usageLimit !== null &&
        promo.usageCount >= promo.usageLimit
      ) {
        return {
          valid: false,
          message: 'This promo code has reached its usage limit.',
        };
      }

      return {
        valid: true,
        message: 'Promo code applied successfully.',
        promo: {
          code: promo.code,
          description: promo.description,
          discountType: promo.discountType,
          discountValue: promo.discountValue,
          minPurchase: promo.minPurchase,
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to validate promo code',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Unable to validate promo code.',
      );
    }
  }
}
