import { UseInterceptors } from '@nestjs/common';
import { AdminOperationalEventInterceptor } from '../operational-logs/admin-operational-event.interceptor.js';
import { Controller, Get, Post, Patch, Param, ParseIntPipe, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { PromosService } from './promos.service.js';

@UseInterceptors(AdminOperationalEventInterceptor)
@Controller('api/admin/promos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Get('list') list(){return this.promosService.list();}

  @Patch(':id') updatePromo(@Param('id',ParseIntPipe) id:number,@Body() dto:any){return this.promosService.updatePromo(id,dto);}

  @Get()
  async getActivePromo() {
    return this.promosService.getActivePromo();
  }

  @Post()
  async savePromo(@Body() dto: any) {
    return this.promosService.savePromo(dto);
  }
}