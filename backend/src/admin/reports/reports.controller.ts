import {Controller,Get,Post,Patch,Query,Param,Body,ParseIntPipe,Req,UseGuards} from '@nestjs/common';
import {ReportsService} from './reports.service.js';
import {JwtAuthGuard,type AuthenticatedRequest} from '../../auth/jwt-auth.guard.js';
import {RolesGuard} from '../../auth/roles.guard.js';import {Roles} from '../../auth/roles.decorator.js';import {ManagementActionPinGuard} from '../../auth/management-action-pin.guard.js';
@Controller('api/admin/reports') @UseGuards(JwtAuthGuard,RolesGuard) @Roles('ADMIN','SUPERADMIN')
export class ReportsController{
 constructor(private readonly reports:ReportsService){}
 @Get('pos') pos(@Query('date') date?:string,@Query('from') from?:string,@Query('to') to?:string){return this.reports.getPosReportData(from??date,to);}
 @Get('closeouts') closeouts(@Query('from') from?:string,@Query('to') to?:string){return this.reports.getSavedCloseoutReports(from,to);}
 @Get('lookups') lookups(){return this.reports.lookups();}
 @Post('closeout') @UseGuards(ManagementActionPinGuard) close(@Req() req:AuthenticatedRequest,@Body() body:any){return this.reports.submitCloseout(req.user.sub,body);}
 @Patch('transactions/:id/links') @UseGuards(ManagementActionPinGuard) links(@Req() req:AuthenticatedRequest,@Param('id',ParseIntPipe) id:number,@Body() body:any){return this.reports.linkLegacy(req.user.sub,id,body);}
}
