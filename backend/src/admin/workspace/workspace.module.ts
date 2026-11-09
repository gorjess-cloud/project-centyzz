import {AdminNotificationsService} from './admin-notifications.service.js';
import {ReportsModule} from '../reports/reports.module.js';
import {
  Body,
  Controller,
  Get,
  Module,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthModule } from '../../auth/auth.module.js';
import {
  JwtAuthGuard,
  type AuthenticatedRequest,
} from '../../auth/jwt-auth.guard.js';
import { RolesGuard } from '../../auth/roles.guard.js';
import { Roles } from '../../auth/roles.decorator.js';
import { ManagementActionPinGuard } from '../../auth/management-action-pin.guard.js';
import { SalonConfigModule } from '../../salon/salon-config.module.js';
import { SalonConfigService } from '../../salon/salon-config.service.js';
import { WorkspaceService } from './workspace.service.js';
@Controller('api/admin/workspace')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class WorkspaceController {
  constructor(
    private readonly workspace: WorkspaceService,
    private readonly config: SalonConfigService,
    private readonly notifications:AdminNotificationsService,
  ) {}
  @Get('notifications') notificationList(@Req() r:AuthenticatedRequest){return this.notifications.list(r.user.sub);}
  @Post('notifications/read') notificationRead(@Req() r:AuthenticatedRequest,@Body() body:any){return this.notifications.read(r.user.sub,body);}
  @Get('dashboard') dashboard(@Query('date') date?: string) {
    return this.workspace.dashboard(date);
  }
  @Get('settings') settings() {
    return this.config.get();
  }
  @Patch('settings/:section')
  @UseGuards(ManagementActionPinGuard)
  save(
    @Req() r: AuthenticatedRequest,
    @Param('section') section: string,
    @Body() body: any,
  ) {
    return this.config.save(r.user.sub, section, body);
  }
  @Get('staff') staff() {
    return this.workspace.staffSummary();
  }
  @Get('database') database() {
    return this.workspace.database();
  }
  @Get('account/activity') activity(@Req() r: AuthenticatedRequest) {
    return this.workspace.activity(r.user.sub);
  }
}
@Module({
  imports: [AuthModule, SalonConfigModule,ReportsModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, ManagementActionPinGuard,AdminNotificationsService],
})
export class WorkspaceModule {}
