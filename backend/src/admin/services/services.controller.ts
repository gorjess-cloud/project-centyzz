import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe } from '@nestjs/common';
import { ServicesService } from './services.service.js';

@Controller('api/admin/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  async getServices(@Query('archived') archived?: string) {
    const isArchived = archived === 'true';
    return this.servicesService.getServices(isArchived);
  }

  @Post()
  async createService(@Body() dto: any) {
    return this.servicesService.createService(dto);
  }

  @Patch(':id')
  async updateService(@Param('id', ParseIntPipe) id: number, @Body() dto: any) {
    return this.servicesService.updateService(id, dto);
  }

  @Patch(':id/status')
  async toggleStatus(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.toggleServiceStatus(id);
  }

  @Patch(':id/archive')
  async toggleArchive(@Param('id', ParseIntPipe) id: number) {
    return this.servicesService.toggleServiceArchive(id);
  }
}