
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { db } from '../prisma/db.js';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  async findAllGroupedByCategory() {
    try {
      const categories = await db.orm.public.ServiceCategory
        .where({ isActive: true })
        .all();

      const result = await Promise.all(
        categories.map(async (category) => {
          const services = await db.orm.public.Service
            .where({
              categoryId: category.id,
              isActive: true,
            })
            .all();

          return {
            id: category.id,
            category: category.name,
            services: services.map((service) => ({
              id: service.id,
              name: service.name,
              description: service.description,
              price: service.price,
              durationMinutes: service.durationMinutes,
            })),
          };
        }),
      );

      return result.filter((category) => category.services.length > 0);
    } catch (error) {
      this.logger.error(
        'Failed to fetch the service catalog',
        error instanceof Error ? error.stack : String(error),
      );

      throw new InternalServerErrorException(
        'Unable to retrieve the service catalog',
      );
    }
  }
}
