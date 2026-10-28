import { Body, Controller, Delete, Get, Headers, Param, ParseIntPipe, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { ManagementActionPinGuard } from '../../auth/management-action-pin.guard.js';
import { InventoryService } from './inventory.service.js';

@Controller('api/admin/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}
  @Get() list() { return this.inventory.list(); }
  @Get('purchase-orders') orders() { return this.inventory.orders(); }
  @Post() @UseGuards(ManagementActionPinGuard)
  create(@Req() r: AuthenticatedRequest, @Headers('idempotency-key') key: string, @Body() body: any) {
    return this.inventory.create(r.user.sub,key,body);
  }
  @Post('purchase-orders') @UseGuards(ManagementActionPinGuard)
  order(@Req() r: AuthenticatedRequest, @Headers('idempotency-key') key: string, @Body() body: any) {
    return this.inventory.createOrder(r.user.sub,key,body);
  }
  @Post(':id/restock') @UseGuards(ManagementActionPinGuard)
  restock(@Req() r: AuthenticatedRequest, @Headers('idempotency-key') key: string, @Param('id',ParseIntPipe) id: number, @Body() body: any) {
    return this.inventory.restock(r.user.sub,key,id,body);
  }
  @Patch(':id/archive') @UseGuards(ManagementActionPinGuard)
  archive(@Req() r: AuthenticatedRequest, @Headers('idempotency-key') key: string, @Param('id',ParseIntPipe) id: number) {
    return this.inventory.changeState(r.user.sub,key,id,'archive');
  }
  @Patch(':id/restore') @UseGuards(ManagementActionPinGuard)
  restore(@Req() r: AuthenticatedRequest, @Headers('idempotency-key') key: string, @Param('id',ParseIntPipe) id: number) {
    return this.inventory.changeState(r.user.sub,key,id,'restore');
  }
  @Delete(':id') @UseGuards(ManagementActionPinGuard)
  hide(@Req() r: AuthenticatedRequest, @Headers('idempotency-key') key: string, @Param('id',ParseIntPipe) id: number) {
    return this.inventory.changeState(r.user.sub,key,id,'hide');
  }
}
