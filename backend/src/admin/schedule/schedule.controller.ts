import { STAFF_JOB_ROLES } from '../users/staff-job-roles.js';
import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Put, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, type AuthenticatedRequest } from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { ManagementActionPinGuard } from '../../auth/management-action-pin.guard.js';
import { ScheduleService } from './schedule.service.js';

@Controller('api/admin/schedule')
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles('ADMIN','SUPERADMIN')
export class ScheduleController {
  constructor(private readonly schedule:ScheduleService) {}
  @Get() roster(@Query('week') week:string) {return this.schedule.roster(week);}
  @Get('staff-job-roles') jobRoles(){return [...STAFF_JOB_ROLES];}
  @Get('staff-users') users(){return this.schedule.staffUsers();}
  @Get('appointments') appointments(@Query('archived') archived?:string){return this.schedule.appointments(archived==='true');}
  @Patch('appointments/:id/retrieve') @UseGuards(ManagementActionPinGuard)
  retrieveAppointment(@Req() r:AuthenticatedRequest,@Param('id',ParseIntPipe) id:number){return this.schedule.retrieveAppointment(r.user.sub,id);}
  @Patch('appointments/:id/cancel') @UseGuards(ManagementActionPinGuard)
  cancelAppointment(@Req() r:AuthenticatedRequest,@Param('id',ParseIntPipe) id:number){return this.schedule.cancelAppointment(r.user.sub,id);}
  @Put('staff/:id/details') @UseGuards(ManagementActionPinGuard)
  details(@Req() r:AuthenticatedRequest,@Param('id',ParseIntPipe) id:number,@Body() body:any){return this.schedule.details(r.user.sub,id,body);}
  @Put('staff/:id/week') @UseGuards(ManagementActionPinGuard)
  save(@Req() r:AuthenticatedRequest,@Param('id',ParseIntPipe) id:number,@Body() body:any){return this.schedule.saveWeek(r.user.sub,id,body);}
  @Patch('staff/:id/archive') @UseGuards(ManagementActionPinGuard)
  archive(@Req() r:AuthenticatedRequest,@Param('id',ParseIntPipe) id:number){return this.schedule.state(r.user.sub,id,'archive');}
  @Patch('staff/:id/restore') @UseGuards(ManagementActionPinGuard)
  restore(@Req() r:AuthenticatedRequest,@Param('id',ParseIntPipe) id:number){return this.schedule.state(r.user.sub,id,'restore');}
  @Delete('staff/:id') @UseGuards(ManagementActionPinGuard)
  hide(@Req() r:AuthenticatedRequest,@Param('id',ParseIntPipe) id:number){return this.schedule.state(r.user.sub,id,'hide');}
}
