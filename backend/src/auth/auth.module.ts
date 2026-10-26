import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { EmailModule } from '../email/email.module.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { ManagementSecurityService } from './management-security.service.js';

@Module({
  imports: [
    EmailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '1h',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, ManagementSecurityService],
  exports: [JwtModule, JwtAuthGuard, AuthService, ManagementSecurityService],
})
export class AuthModule {}
