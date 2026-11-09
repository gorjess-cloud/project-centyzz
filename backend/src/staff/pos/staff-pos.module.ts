import {
  Body,
  Controller,
  Get,
  Module,
  Post,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../auth/jwt-auth.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { ManagementActionPinGuard } from '../../auth/management-action-pin.guard.js';
import { StaffPosService } from './staff-pos.service.js';
import { ReportsModule } from '../../admin/reports/reports.module.js';
import { ReportsService } from '../../admin/reports/reports.service.js';
import { reportToday } from '../../admin/reports/report-math.js';
@Controller('api/staff/pos')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('STAFF')
export class StaffPosController {
  constructor(
    private readonly pos: StaffPosService,
    private readonly reports: ReportsService,
  ) {}
  @Post('quote') quote(@Req() r:AuthenticatedRequest,@Body() body:any){return this.pos.quote(r.user.sub,body);}
  @Post('checkout') checkout(
    @Req() r: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.pos.checkout(r.user.sub, body);
  }
  @Get('transactions/:id') transaction(
    @Req() r: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.pos.transactionDetails(r.user.sub, id);
  }
  @Get('daily') daily(@Req() r: AuthenticatedRequest) {
    return this.reports.getPosReportData(
      reportToday(),
      reportToday(),
      r.user.sub,
    );
  }
  @Post('closeout') @UseGuards(ManagementActionPinGuard) closeout(
    @Req() r: AuthenticatedRequest,
    @Body() body: any,
  ) {
    return this.reports.submitCloseout(
      r.user.sub,
      { ...body, reportDate: reportToday() },
      true,
    );
  }
}
@Module({
  imports: [AuthModule, ReportsModule],
  controllers: [StaffPosController],
  providers: [StaffPosService, ManagementActionPinGuard],
})
export class StaffPosModule {}
