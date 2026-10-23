import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { PromosService } from './promos.service.js';

@Controller('api/promos')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Get()
  getActivePromos() {
    return this.promosService.findActivePromos();
  }

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validatePromo(@Body() body: { promoCode?: string }) {
    return this.promosService.validatePromo(body?.promoCode ?? '');
  }
}
