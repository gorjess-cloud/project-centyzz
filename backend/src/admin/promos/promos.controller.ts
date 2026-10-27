import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { PromosService } from './promos.service.js';

@Controller('api/admin/promos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Get()
  async getActivePromo() {
    return this.promosService.getActivePromo();
  }

  @Post()
  async savePromo(@Body() dto: any) {
    return this.promosService.savePromo(dto);
  }
}