import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { db } from '../../prisma/db.js';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  // Helper method to safely retrieve table records without contract schema validation dependencies
  private async getTableAccessor(): Promise<any> {
    const ormPublic = (db as any)?.orm?.public || (db as any)?.orm || db;
    
    // Check various casing permutations
    return (
      ormPublic?.clients ||
      ormPublic?.client ||
      ormPublic?.Client ||
      ormPublic?.Clients ||
      null
    );
  }

  // 1. Fetch All Clients (Filtered by Archive Status)
  async getClients(isArchived = false) {
    try {
      const model = await this.getTableAccessor();
      
      // If model accessor is available, query through ORM
      let allClients: any[] = [];
      if (model && typeof model.where === 'function') {
        allClients = await model.where({}).all();
      } else {
        // Fallback: If direct postgres connection tag is available
        if (typeof (db as any) === 'function') {
          allClients = await (db as any)`SELECT * FROM public.clients ORDER BY id DESC;`;
        }
      }

      if (!allClients || !Array.isArray(allClients) || allClients.length === 0) {
        return [];
      }

      // Filter by archive status
      const filtered = allClients.filter((c: any) => {
        const archived = !!(c.archived_at || c.archivedAt);
        return isArchived ? archived : !archived;
      });

      return filtered.map((c: any) => {
        const firstName = c.first_name || c.firstName || '';
        const lastName = c.last_name || c.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim() || c.email;
        const totalSpendNum = Number(c.total_spend || c.totalSpend || 0);
        const totalVisitsNum = Number(c.total_visits || c.totalVisits || 0);

        let parsedHistory = c.booking_history || c.bookingHistory || [];
        if (typeof parsedHistory === 'string') {
          try {
            parsedHistory = JSON.parse(parsedHistory);
          } catch {
            parsedHistory = [];
          }
        }

        return {
          id: c.id,
          fullName,
          firstName,
          lastName,
          email: c.email || '',
          contactNumber: c.phone || 'N/A',
          gender: c.gender || 'Female',
          tier: (c.tier || 'REGULAR').toUpperCase() === 'VIP' ? 'VIP' : 'Regular',
          lastVisit: (c.last_visit || c.lastVisit)
            ? new Date(c.last_visit || c.lastVisit).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'N/A',
          totalVisits: totalVisitsNum,
          totalSpend: `₱ ${totalSpendNum.toLocaleString()}`,
          avgPerVisit: `₱ ${Math.round(totalSpendNum / Math.max(totalVisitsNum, 1)).toLocaleString()}`,
          clientSince: (c.created_at || c.createdAt)
            ? new Date(c.created_at || c.createdAt).getFullYear().toString()
            : '2026',
          status: (c.is_active ?? c.isActive ?? true) ? 'Active' : 'Inactive',
          isArchived: !!(c.archived_at || c.archivedAt),
          notes: c.notes || 'No special notes provided.',
          avatarColor: 'bg-[#4A3928]',
          bookingHistory: Array.isArray(parsedHistory) ? parsedHistory : [],
          favoriteService: c.favorite_service || c.favoriteService || 'None yet',
        };
      });
    } catch (error) {
      this.logger.error('Error fetching clients in service:', error);
      return [];
    }
  }

  // 2. Fetch Single Client Profile with Booking History
  async getClientById(id: number) {
    const clients = await this.getClients(false);
    const client = clients.find((c) => Number(c.id) === Number(id));
    if (!client) throw new NotFoundException('Client record not found.');
    return client;
  }

  // 3. Create New Client
  async createClient(dto: any) {
    const model = await this.getTableAccessor();
    if (!model || typeof model.create !== 'function') {
      throw new BadRequestException('Client model connection uninitialized.');
    }

    if (!dto.fullName && (!dto.firstName || !dto.lastName)) {
      throw new BadRequestException('Client full name or first & last name are required.');
    }

    const nameParts = dto.fullName ? dto.fullName.trim().split(' ') : [];
    const firstName = dto.firstName?.trim() || nameParts[0] || '';
    const lastName = dto.lastName?.trim() || nameParts.slice(1).join(' ') || '';

    return await model.create({
      first_name: firstName,
      last_name: lastName,
      email: dto.email.toLowerCase().trim(),
      phone: dto.contactNumber || dto.phone || '(+63) 9000000000',
      gender: dto.gender || 'Female',
      tier: (dto.tier || 'REGULAR').toUpperCase(),
      notes: dto.notes || '',
      is_active: true,
      total_visits: 0,
      total_spend: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // 4. Update Client Profile
  async updateClient(id: number, dto: any) {
    const model = await this.getTableAccessor();
    if (!model || typeof model.where !== 'function') {
      throw new NotFoundException('Client model connection uninitialized.');
    }

    const updateData: any = { updated_at: new Date().toISOString() };

    if (dto.fullName) {
      const parts = dto.fullName.trim().split(' ');
      updateData.first_name = parts[0];
      updateData.last_name = parts.slice(1).join(' ') || '';
    }
    if (dto.firstName) updateData.first_name = dto.firstName.trim();
    if (dto.lastName) updateData.last_name = dto.lastName.trim();
    if (dto.email) updateData.email = dto.email.toLowerCase().trim();
    if (dto.contactNumber || dto.phone) updateData.phone = (dto.contactNumber || dto.phone).trim();
    if (dto.gender) updateData.gender = dto.gender;
    if (dto.tier) updateData.tier = dto.tier.toUpperCase();
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    return await model.where({ id: Number(id) }).update(updateData);
  }

  // 5. Toggle Archive Client
  async toggleClientArchive(id: number, currentUserId?: number) {
    const model = await this.getTableAccessor();
    if (!model || typeof model.where !== 'function') {
      throw new NotFoundException('Client model connection uninitialized.');
    }

    const client: any = await model.where({ id: Number(id) }).first();
    if (!client) throw new NotFoundException('Client record not found.');

    const isCurrentlyArchived = !!(client.archived_at || client.archivedAt);

    return await model.where({ id: Number(id) }).update({
      archived_at: isCurrentlyArchived ? null : new Date().toISOString(),
      archived_by: isCurrentlyArchived ? null : (currentUserId || null),
      updated_at: new Date().toISOString(),
    });
  }

  // 6. Record New Appointment / Booking for Client
  async addClientBooking(id: number, dto: any) {
    const model = await this.getTableAccessor();
    if (!model || typeof model.where !== 'function') {
      throw new NotFoundException('Client model connection uninitialized.');
    }

    const client: any = await model.where({ id: Number(id) }).first();
    if (!client) throw new NotFoundException('Client record not found.');

    const currentVisits = Number(client.total_visits || client.totalVisits || 0);
    const newVisits = currentVisits + 1;
    
    const addedAmount = Number(String(dto.amount || '0').replace(/[^0-9.]/g, ''));
    const currentSpend = Number(client.total_spend || client.totalSpend || 0);
    const newTotalSpend = currentSpend + addedAmount;

    let existingHistory = client.booking_history || client.bookingHistory || [];
    if (typeof existingHistory === 'string') {
      try {
        existingHistory = JSON.parse(existingHistory);
      } catch {
        existingHistory = [];
      }
    }

    const newBooking = {
      id: `b_${Date.now()}`,
      service: dto.serviceTitle || dto.service || 'Salon Treatment',
      note: dto.note || 'Booked via Admin Desk',
      date: dto.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      amount: `₱ ${addedAmount.toLocaleString()}`,
    };

    return await model.where({ id: Number(id) }).update({
      total_visits: newVisits,
      total_spend: newTotalSpend,
      last_visit: new Date().toISOString(),
      favorite_service: dto.serviceTitle || dto.service || client.favorite_service || client.favoriteService,
      booking_history: [newBooking, ...existingHistory],
      updated_at: new Date().toISOString(),
    });
  }
}