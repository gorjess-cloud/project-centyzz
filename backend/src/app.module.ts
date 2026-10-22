
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { EmailModule } from './email/email.module.js';
import { ServicesModule } from './services/services.module.js';
import { AppointmentsModule } from './appointments/appointments.module.js';
import { PromosModule } from './promos/promos.module.js';
import { SuperadminModule } from './superadmin/superadmin.module.js';

@Module({
  imports: [
    AuthModule,
    EmailModule,
    ServicesModule,
    AppointmentsModule,
    PromosModule,
    SuperadminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
