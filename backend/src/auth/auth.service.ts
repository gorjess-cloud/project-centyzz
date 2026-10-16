import { createHmac, randomInt } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service.js';
import * as bcrypt from 'bcrypt';
import { db } from '../prisma/db.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';

@Injectable()
export class AuthService {
  constructor(
  private readonly jwtService: JwtService,
  private readonly emailService: EmailService,
) {}

  private hashOtp(email: string, otp: string): string {
  const secret = process.env.OTP_SECRET;

  if (!secret) {
    throw new Error('OTP_SECRET is not configured');
  }

  return createHmac('sha256', secret)
    .update(`${email}:${otp}`)
    .digest('hex');
}

  
async register(registerDto: RegisterDto) {
  const { firstName, lastName, email, password } = registerDto;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await db.orm.public.User.where({
    email: normalizedEmail,
  }).first();

  if (existingUser) {
    throw new ConflictException('Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const otp = randomInt(100000, 1000000).toString();
  const otpHash = this.hashOtp(normalizedEmail, otp);
  const otpExpiresAt = new Date(
    Date.now() + 5 * 60 * 1000,
  ).toISOString();

  const user = await db.orm.public.User.create({
    email: normalizedEmail,
    passwordHash,
    firstName,
    lastName,
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: false,
    otpHash,
    otpExpiresAt,
    otpAttempts: 0,
  });

  await this.emailService.sendOtpEmail(normalizedEmail, otp);

  return {
    success: true,
    message: 'Registration successful. Please check your email for the verification code.',
    data: {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
      },
    },
  };
}


async verifyEmail(verifyEmailDto: VerifyEmailDto) {
  const normalizedEmail = verifyEmailDto.email.toLowerCase().trim();

  const user = await db.orm.public.User.where({
    email: normalizedEmail,
  }).first();

  if (!user) {
    throw new UnauthorizedException('Invalid email or verification code');
  }

  if (user.emailVerified) {
    return {
      success: true,
      message: 'Email is already verified',
    };
  }

  if (!user.otpHash || !user.otpExpiresAt) {
    throw new UnauthorizedException('No active verification code. Please request a new one.');
  }

  if (user.otpAttempts >= 5) {
    throw new ForbiddenException('Too many incorrect attempts. Please request a new verification code.');
  }

  const expiresAt = new Date(user.otpExpiresAt).getTime();

  if (Date.now() > expiresAt) {
    throw new UnauthorizedException('Verification code has expired. Please request a new one.');
  }

  const submittedHash = this.hashOtp(normalizedEmail, verifyEmailDto.otp);

  if (submittedHash !== user.otpHash) {
    await db.orm.public.User.where({
      id: user.id,
    }).update({
      otpAttempts: user.otpAttempts + 1,
    });

    throw new UnauthorizedException('Invalid email or verification code');
  }

  await db.orm.public.User.where({
    id: user.id,
  }).update({
    emailVerified: true,
    otpHash: null,
    otpExpiresAt: null,
    otpAttempts: 0,
  });

  return {
    success: true,
    message: 'Email verified successfully. You can now log in.',
  };
}


  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const normalizedEmail = email.toLowerCase().trim();

    const user = await db.orm.public.User.where({
      email: normalizedEmail,
    }).first();

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in',
      );
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      success: true,
      message: 'Login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      },
    };
  }
}