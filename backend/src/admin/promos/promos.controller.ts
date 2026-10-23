import { Controller, Get, Post, Body } from '@nestjs/common';
import { PromosService } from './promos.service.js';

@Controller('api/admin/promos')
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