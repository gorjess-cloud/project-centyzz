import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { EmailModule } from './email/email.module.js';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}