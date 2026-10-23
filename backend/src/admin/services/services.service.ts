import { 
  Injectable, 
  NotFoundException, 
  BadRequestException, 
  Logger 
} from '@nestjs/common';
import { db } from '../../prisma/db.js';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  // Helper to map category_id numbers to category names for your UI badges
  private getCategoryName(categoryId: number): string {
    switch (Number(categoryId)) {
      case 1: return 'HAIR';
      case 2: return 'NAILS';
      case 3: return 'SKIN'; // or spa/combos
      default: return 'HAIR';
    }
  }

  private getCategoryId(categoryName: string): number {
    const cat = String(categoryName || 'HAIR').toUpperCase();
    if (cat === 'HAIR') return 1;
    if (cat === 'NAILS') return 2;
    if (cat === 'SKIN') return 3;
    return 1;
  }

  // 1. Fetch Services (Active or Archived)
  async getServices(isArchived = false) {
    try {
      const allServices: any[] = await db.orm.public.Service.where({}).all();
      
      if (!allServices || allServices.length === 0) {
        return [];
      }

      const filtered = allServices.filter(s => {
        const archived = !!(s.archivedAt || s.archived_at);
        return isArchived ? archived : !archived;
      });

      return filtered.map((s) => {
        const isActive = s.isActive ?? s.is_active ?? true;
        const archivedAt = s.archivedAt || s.archived_at;
        const durationMins = s.durationMinutes || s.duration_minutes || 30;
        
        // Format duration nicely for your UI (e.g., 60 mins -> "1 hr")
        let durationStr = `${durationMins} mins`;
        if (durationMins >= 60) {
          const hrs = Math.floor(durationMins / 60);
          const mins = durationMins % 60;
          durationStr = mins > 0 ? `${hrs} hr ${mins} mins` : `${hrs} hr${hrs > 1 ? 's' : ''}`;
        }

        const rawPrice = s.price || '0';
        const formattedPrice = String(rawPrice).includes('₱') ? rawPrice : `₱${Number(String(rawPrice).replace(/,/g, '')).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

        const createdAtVal = s.createdAt || s.created_at;

        return {
          id: s.id,
          category: this.getCategoryName(s.categoryId || s.category_id || 1),
          name: s.name,
          duration: durationStr,
          durationMinutes: durationMins,
          price: formattedPrice,
          status: isActive ? 'ACTIVE' : 'INACTIVE',
          isArchived: !!archivedAt,
          description: s.description || '',
          dateCreated: createdAtVal ? new Date(createdAtVal).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }) : 'N/A',
        };
      });
    } catch (error) {
      this.logger.error('Error fetching services:', error);
      return [];
    }
  }

  // 2. Create Service
  async createService(dto: any) {
    if (!dto.name || !dto.price) {
      throw new BadRequestException('Service name and price are required.');
    }

    const existing = await db.orm.public.Service.where({ name: dto.name.trim() }).first();
    if (existing) {
      throw new BadRequestException('A service with this name already exists.');
    }

    const hours = parseInt(dto.durationHours || '1', 10);
    const mins = parseInt(dto.durationMins || '0', 10);
    const totalMinutes = (hours * 60) + mins || 30;

    const rawPriceNum = String(dto.price).replace(/[^\d.]/g, '');

    const payload: any = {
      category_id: this.getCategoryId(dto.category),
      name: dto.name.trim(),
      description: dto.description ? dto.description.trim() : null,
      price: rawPriceNum,
      duration_minutes: totalMinutes,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return await db.orm.public.Service.create(payload);
  }

  // 3. Update Service
  async updateService(numberId: number, dto: any) {
    const service = await db.orm.public.Service.where({ id: numberId }).first();
    if (!service) throw new NotFoundException('Service not found.');

    const updateData: any = { updated_at: new Date().toISOString() };
    if (dto.name) updateData.name = dto.name.trim();
    if (dto.category) updateData.category_id = this.getCategoryId(dto.category);
    if (dto.price) {
      updateData.price = String(dto.price).replace(/[^\d.]/g, '');
    }
    if (dto.durationHours !== undefined || dto.durationMins !== undefined) {
      const hours = parseInt(dto.durationHours || '0', 10);
      const mins = parseInt(dto.durationMins || '0', 10);
      updateData.duration_minutes = (hours * 60) + mins || 30;
    }
    if (dto.description !== undefined) updateData.description = dto.description.trim();

    return await db.orm.public.Service.where({ id: numberId }).update(updateData);
  }

  // 4. Toggle Status (Active / Inactive)
  async toggleServiceStatus(numberId: number) {
    const service: any = await db.orm.public.Service.where({ id: numberId }).first();
    if (!service) throw new NotFoundException('Service not found.');

    const currentActive = service.isActive ?? service.is_active ?? true;

    const updateData: any = {
      is_active: !currentActive,
      updated_at: new Date().toISOString()
    };

    return await db.orm.public.Service.where({ id: numberId }).update(updateData);
  }

  // 5. Toggle Archive
  async toggleServiceArchive(numberId: number) {
    const service: any = await db.orm.public.Service.where({ id: numberId }).first();
    if (!service) throw new NotFoundException('Service not foundLinkClicked');

    const archivedAt = service.archivedAt || service.archived_at;
    const isCurrentlyArchived = !!archivedAt;

    const updateData: any = {
      archived_at: isCurrentlyArchived ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return await db.orm.public.Service.where({ id: numberId }).update(updateData);
  }
}