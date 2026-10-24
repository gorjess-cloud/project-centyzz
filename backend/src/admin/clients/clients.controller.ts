import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, ParseIntPipe, Req } from '@nestjs/common';
import { ClientsService } from './clients.service.js';

@Controller('api/admin/clients')
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
    return this.clientsService.toggleClientArchive(id, req.user?.id);
  }

  @Post(':id/bookings')
  async addClientBooking(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.clientsService.addClientBooking(id, dto);
  }
}