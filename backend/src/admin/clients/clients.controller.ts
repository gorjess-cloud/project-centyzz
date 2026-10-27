import { UseInterceptors } from '@nestjs/common';
import { AdminOperationalEventInterceptor } from '../operational-logs/admin-operational-event.interceptor.js';
import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { ClientsService } from './clients.service.js';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';

@UseInterceptors(AdminOperationalEventInterceptor)
@Controller('api/admin/clients')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  async getClients(@Query('archived') archived?: string) {
    const isArchived = archived === 'true';
    return this.clientsService.getClients(isArchived);
  }

  @Get(':id')
  async getClientById(@Param('id', ParseIntPipe) id: number) {
    return this.clientsService.getClientById(id);
  }

  @Post()
  async createClient(@Body() dto: any) {
    return this.clientsService.createClient(dto);
  }

  @Patch(':id')
  async updateClient(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.clientsService.updateClient(id, dto);
  }

  @Patch(':id/archive')
  async toggleArchive(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
  return this.clientsService.toggleClientArchive(id, req.user.sub);
  }

  @Post(':id/bookings')
  async addClientBooking(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.clientsService.addClientBooking(id, dto);
  }
}