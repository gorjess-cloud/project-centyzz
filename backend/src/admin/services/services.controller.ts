import { UseInterceptors } from '@nestjs/common';
import { AdminOperationalEventInterceptor } from '../operational-logs/admin-operational-event.interceptor.js';
import { Controller, Get, Post, Patch, Param, Body, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { ServicesService } from './services.service.js';

@UseInterceptors(AdminOperationalEventInterceptor)
@Controller('api/admin/services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('categories')
  getCategories() {
    return this.servicesService.getCategories();
  }

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