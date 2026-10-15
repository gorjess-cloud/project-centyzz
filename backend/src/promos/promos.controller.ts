import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { PromosService } from './promos.service.js';

@Controller('api/promos')
export class PromosController {
  constructor(private readonly promosService: PromosService) {}

  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validatePromo(@Body() body: { promoCode?: string }) {
    return this.promosService.validatePromo(body?.promoCode ?? '');
  }
}