// backend/src/admin/clients/clients.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger, InternalServerErrorException } from '@nestjs/common';
import { db } from '../../prisma/db.js';

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  // Helper to safely access client model regardless of casing
  private getClientModel() {
    return (db as any).orm?.public?.Client || (db as any).orm?.public?.client || (db as any).orm?.public?.clients;
  }

  // 1. Fetch All Clients (Filtered by Archive Status)
  async getClients(isArchived = false) {
    try {
      const ClientModel = this.getClientModel();
      if (!ClientModel) {
        throw new InternalServerErrorException('Client data model is unavailable.');
      }

      const allClients: any[] = await ClientModel.where({}).all();

      if (!allClients || !Array.isArray(allClients) || allClients.length === 0) {
        return [];
      }

      // Filter by archive status
      const filtered = allClients.filter((c: any) => {
        const archived = !!(c.archivedAt || c.archived_at);
        return isArchived ? archived : !archived;
      });

      return filtered.map((c: any) => {
        const firstName = c.firstName || c.first_name || '';
        const lastName = c.lastName || c.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || c.email;
        const totalSpendNum = Number(c.totalSpend || c.total_spend || 0);
        const totalVisitsNum = Number(c.totalVisits || c.total_visits || 0);

        let parsedHistory = c.bookingHistory || c.booking_history || [];
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
          gender: c.gender || '',
          tier: (c.tier || 'REGULAR').toUpperCase() === 'VIP' ? 'VIP' : 'Regular',
          lastVisit: (c.lastVisit || c.last_visit)
            ? new Date(c.lastVisit || c.last_visit).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'N/A',
          totalVisits: totalVisitsNum,
          totalSpend: `₱ ${totalSpendNum.toLocaleString()}`,
          avgPerVisit: `₱ ${Math.round(totalSpendNum / Math.max(totalVisitsNum, 1)).toLocaleString()}`,
          clientSince: (c.createdAt || c.created_at)
            ? new Date(c.createdAt || c.created_at).getFullYear().toString()
            : 'N/A',
          status: (c.isActive ?? c.is_active ?? true) ? 'Active' : 'Inactive',
          isArchived: !!(c.archivedAt || c.archived_at),
          notes: c.notes || 'No special notes provided.',
          avatarColor: 'bg-[#4A3928]',
          bookingHistory: Array.isArray(parsedHistory) ? parsedHistory : [],
          favoriteService: c.favoriteService || c.favorite_service || 'None yet',
        };
      });
    } catch (error) {
      this.logger.error('Error fetching clients in service:', error);
      throw error;
    }
  }

  // 2. Fetch Single Client Profile
  async getClientById(id: number) {
    const ClientModel = this.getClientModel();
    const client = await ClientModel.where({ id }).first();
    if (!client) throw new NotFoundException('Client record not found.');
    return client;
  }

  // 3. Create New Client
  async createClient(dto: any) {
    if (!dto.fullName && (!dto.firstName || !dto.lastName)) {
      throw new BadRequestException('Client full name or first & last name are required.');
    }

    const nameParts = dto.fullName ? dto.fullName.trim().split(' ') : [];
    const firstName = dto.firstName?.trim() || nameParts[0] || '';
    const lastName = dto.lastName?.trim() || nameParts.slice(1).join(' ') || '';

    const email = (dto.email || '').toLowerCase().trim();
    const phone = dto.contactNumber || dto.phone || null;
    const gender = dto.gender || 'Female';
    const tier = (dto.tier || 'REGULAR').toUpperCase();
    const notes = dto.notes || '';

    const ClientModel = this.getClientModel();
    return await ClientModel.create({
      firstName,
      lastName,
      email,
      phone,
      gender,
      tier,
      notes,
      isActive: true,
      totalVisits: 0,
      totalSpend: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  // 4. Update Client Profile
  async updateClient(id: number, dto: any) {
    const ClientModel = this.getClientModel();
    const client = await ClientModel.where({ id }).first();
    if (!client) throw new NotFoundException('Client record not found.');

    const nameParts = dto.fullName ? dto.fullName.trim().split(' ') : [];
    const updateData: any = { updatedAt: new Date().toISOString() };

    if (dto.firstName || dto.fullName) updateData.firstName = dto.firstName?.trim() || nameParts[0];
    if (dto.lastName || dto.fullName) updateData.lastName = dto.lastName?.trim() || nameParts.slice(1).join(' ');
    if (dto.email) updateData.email = dto.email.toLowerCase().trim();
    if (dto.contactNumber || dto.phone) updateData.phone = dto.contactNumber || dto.phone;
    if (dto.gender) updateData.gender = dto.gender;
    if (dto.tier) updateData.tier = dto.tier.toUpperCase();
    if (dto.notes !== undefined) updateData.notes = dto.notes;

    return await ClientModel.where({ id }).update(updateData);
  }

  // 5. Toggle Archive Client
  async toggleClientArchive(id: number, currentUserId?: number) {
    const ClientModel = this.getClientModel();
    const client: any = await ClientModel.where({ id }).first();
    if (!client) throw new NotFoundException('Client record not found.');

    const isCurrentlyArchived = !!(client.archivedAt ?? client.archived_at);

    return await ClientModel.where({ id }).update({
      archivedAt: isCurrentlyArchived ? null : new Date().toISOString(),
      archivedBy: isCurrentlyArchived ? null : (currentUserId || null),
      updatedAt: new Date().toISOString(),
    });
  }

  // 6. Record New Booking for Client
  async addClientBooking(id: number, dto: any) {
    const ClientModel = this.getClientModel();
    const client: any = await ClientModel.where({ id }).first();
    if (!client) throw new NotFoundException('Client record not found.');

    const currentVisits = Number(client.totalVisits || client.total_visits || 0);
    const newVisits = currentVisits + 1;

    const addedAmount = Number(String(dto.amount || '0').replace(/[^0-9.]/g, ''));
    const currentSpend = Number(client.totalSpend || client.total_spend || 0);
    const newTotalSpend = currentSpend + addedAmount;

    let existingHistory = client.bookingHistory || client.booking_history || [];
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

    const updatedHistory = JSON.stringify([newBooking, ...(Array.isArray(existingHistory) ? existingHistory : [])]);

    return await ClientModel.where({ id }).update({
      totalVisits: newVisits,
      totalSpend: newTotalSpend,
      lastVisit: new Date().toISOString(),
      favoriteService: dto.serviceTitle || dto.service || client.favoriteService,
      bookingHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    });
  }
}