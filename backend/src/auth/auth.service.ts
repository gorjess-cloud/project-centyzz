import {insertOperationalEvent} from '../admin/operational-logs/operational-logs.service.js';
import { validateAccountAvatar } from './account-avatar.js';
import { createHmac, randomInt, randomBytes } from 'node:crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
  BadRequestException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service.js';
import * as bcrypt from 'bcrypt';
import { db } from '../prisma/db.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { OAuth2Client } from 'google-auth-library';
import { ManagementSecurityService, isManagementRole } from './management-security.service.js';

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
);
  constructor(
  private readonly jwtService: JwtService,
  private readonly emailService: EmailService,
  private readonly managementSecurity: ManagementSecurityService,
) {}

private normalizeAccountRole(role: string): string {
  const normalized = role.trim().toUpperCase().replace(/[\s_-]+/g, '');
  if (!['SUPERADMIN', 'ADMIN', 'STAFF', 'CUSTOMER'].includes(normalized)) {
    throw new ForbiddenException('This account has an unsupported role');
  }
  return normalized;
}

async getMyProfile(userId: number) {
  const user = await db.orm.public.User.where({ id: userId }).first();
  if (!user || !user.isActive) {
    throw new UnauthorizedException('Account unavailable');
  }
  const management = isManagementRole(user.role) ? await this.managementSecurity.get(user.id) : null;
  return {
    success: true,
    data: {
      id: user.id,
      phoneNumber: management?.phone_number || '',
      avatarUrl:management?.avatar_data_url||'',
      fullName:[user.firstName,user.lastName].filter(Boolean).join(' '),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: this.normalizeAccountRole(user.role),
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
  };
}

async updateMyProfile(userId: number, profile: UpdateProfileDto) {
  const firstName = profile.firstName.trim();
  const lastName = profile.lastName.trim();
  if (!firstName || !lastName) {
    throw new BadRequestException('First and last name are required');
  }
  const user = await db.orm.public.User.where({ id: userId }).first();
  if (!user || !user.isActive) {
    throw new UnauthorizedException('Account unavailable');
  }
  const avatar=validateAccountAvatar(profile.avatarUrl);
  if(profile.phoneNumber!==undefined&&profile.phoneNumber.trim()!==''&&!/^\+?[\d\s()-]{7,20}$/.test(profile.phoneNumber.trim()))throw new BadRequestException('Enter a valid phone number');
  const client=await this.managementSecurity.pool.connect();
  try {
    await client.query('BEGIN');
    const previous=(await client.query('SELECT u."firstName",u."lastName",s.phone_number,s.avatar_data_url FROM public."user" u LEFT JOIN public.management_security s ON s.user_id=u.id WHERE u.id=$1 FOR UPDATE OF u',[userId])).rows[0];
    const changed=previous.firstName!==firstName||previous.lastName!==lastName||(isManagementRole(user.role)&&((profile.phoneNumber!==undefined&&(previous.phone_number||'')!==profile.phoneNumber.trim())||(avatar!==undefined&&(previous.avatar_data_url||'')!==avatar)));
    if(!changed){await client.query('COMMIT');return this.getMyProfile(userId);}
    await client.query('UPDATE public."user" SET "firstName"=$2,"lastName"=$3,"updatedAt"=now() WHERE id=$1',[userId,firstName,lastName]);
    if(isManagementRole(user.role)) {
      const updated=await client.query(`UPDATE public.management_security SET phone_number=coalesce($2,phone_number),avatar_data_url=coalesce($3,avatar_data_url),updated_at=now() WHERE user_id=$1 RETURNING user_id`,[userId,profile.phoneNumber?.trim()??null,avatar??null]);
      if(!updated.rowCount)throw new ForbiddenException('Management profile is unavailable');
      await insertOperationalEvent({module:'Account Settings',event:'Profile Updated',actorUserId:userId,userName:[firstName,lastName].join(' '),userRole:user.role,details:'Personal profile updated'},client);
    }
    await client.query('COMMIT');
  }catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
  return this.getMyProfile(userId);
}

  private hashOtp(email: string, otp: string): string {
  const secret = process.env.OTP_SECRET;

  if (!secret) {
    throw new Error('OTP_SECRET is not configured');
  }

  return createHmac('sha256', secret)
    .update(`${email}:${otp}`)
    .digest('hex');
}

async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const genericResponse = {
      success: true,
      message: 'If that email is registered, an OTP has been sent.',
    };

    const user = await db.orm.public.User.where({ email: normalizedEmail }).first();
    if (!user || !user.isActive) {
      return genericResponse;
    }

    const otp = randomInt(100000, 1000000).toString();
    const otpHash = this.hashOtp(normalizedEmail, otp);
    const otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await db.orm.public.User.where({ id: user.id }).update({
      otpHash,
      otpExpiresAt,
      otpAttempts: 0,
    });
    await this.emailService.sendPasswordResetOtpEmail(normalizedEmail, otp);
    return genericResponse;
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.orm.public.User.where({ email: normalizedEmail }).first();

    if (!user || !user.isActive || !user.otpHash || !user.otpExpiresAt) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    if (user.otpAttempts >= 5) {
      throw new BadRequestException('Too many attempts. Request a new code.');
    }
    if (new Date(user.otpExpiresAt).getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired');
    }

    if (!/^\d{6}$/.test(otp) || this.hashOtp(normalizedEmail, otp) !== user.otpHash) {
      await db.orm.public.User.where({ id: user.id }).update({
        otpAttempts: user.otpAttempts + 1,
      });
      throw new BadRequestException('Invalid or expired OTP');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.orm.public.User.where({ id: user.id }).update({
      passwordHash,
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
    });

    return {
      success: true,
      message: 'Password has been successfully reset. You can now log in.',
    };
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

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const role = this.normalizeAccountRole(user.role);

    // Employee accounts are provisioned by administrators. Customer accounts
    // still need to complete the email verification flow before sign-in.
    if (role === 'CUSTOMER' && !user.emailVerified) {
      throw new ForbiddenException(
        'Please verify your email before logging in',
      );
    }

    if (isManagementRole(role)) {
      const security = await this.managementSecurity.requireConfigured(user.id);
      const pinChallengeToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, role, purpose: 'pin', credentialVersion: ['ADMIN','STAFF'].includes(role) ? security.credential_version ?? 0 : undefined },
        { expiresIn: '5m' },
      );
      return {
        success: true,
        message: 'Password verified. Enter your management PIN.',
        data: { pinChallengeToken, user: this.safeUser(user) },
      };
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id, email: user.email, role, purpose: 'access',
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
          role,
          isActive: user.isActive,
        },
      },
    };
  }
  
  async googleLogin(idToken: string) {
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      throw new Error('GOOGLE_CLIENT_ID is not configured');
    }

    let payload;

    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: clientId,
      });

      payload = ticket.getPayload();
    } catch {
      throw new UnauthorizedException('Invalid Google ID token');
    }

    if (
      !payload ||
      !payload.sub ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      throw new UnauthorizedException(
        'Google account email must be verified',
      );
    }

    const normalizedEmail = payload.email.toLowerCase().trim();

    let user = await db.orm.public.User.where({
      email: normalizedEmail,
    }).first();

    if (user && !user.isActive) {
      throw new UnauthorizedException('Account is inactive');
    }

    if (user) {
      // A verified Google email proves control of this email address.
      // Preserve the existing role and password.
      if (!user.emailVerified) {
        await db.orm.public.User.where({
          id: user.id,
        }).update({
          emailVerified: true,
          otpHash: null,
          otpExpiresAt: null,
          otpAttempts: 0,
        });

        user = await db.orm.public.User.where({
          id: user.id,
        }).first();
      }
    } else {
      const nameParts = (payload.name ?? '').trim().split(/\s+/);
      const firstName =
        payload.given_name || nameParts[0] || 'Google';
      const lastName =
        payload.family_name ||
        nameParts.slice(1).join(' ') ||
        'User';

      // Google-only accounts receive a random password hash.
      // The random password itself is never returned or stored.
      const randomPassword = randomBytes(32).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 12);

      user = await db.orm.public.User.create({
        email: normalizedEmail,
        passwordHash,
        firstName,
        lastName,
        role: 'CUSTOMER',
        isActive: true,
        emailVerified: true,
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
      });
    }

    if (!user) {
      throw new UnauthorizedException(
        'Unable to retrieve the user account',
      );
    }

    const role = this.normalizeAccountRole(user.role);

    if (isManagementRole(role)) {
      await this.managementSecurity.requireConfigured(user.id);
      const pinChallengeToken = await this.jwtService.signAsync(
        { sub: user.id, email: user.email, role, purpose: 'pin' },
        { expiresIn: '5m' },
      );
      return {
        success: true,
        message: 'Google identity verified. Enter your management PIN.',
        data: { pinChallengeToken, user: this.safeUser(user) },
      };
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id, email: user.email, role, purpose: 'access',
    });

    return {
      success: true,
      message: 'Google login successful',
      data: {
        accessToken,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role,
          isActive: user.isActive,
        },
      },
    };
  }


  private safeUser(user: { id: number; email: string; firstName: string; lastName: string; role: string; isActive: boolean }) {
    return {
      id: user.id, email: user.email, firstName: user.firstName,
      lastName: user.lastName, role: this.normalizeAccountRole(user.role), isActive: user.isActive,
    };
  }

  private async verifyPurposeToken(token: string, purpose: 'pin' | 'setup') {
    try {
      const payload = await this.jwtService.verifyAsync<{
        sub: number; email: string; role: string; purpose: string; credentialVersion?: number;
      }>(token);
      if (!Number.isInteger(payload.sub) || payload.purpose !== purpose || !isManagementRole(payload.role)) {
        throw new UnauthorizedException('Invalid verification token');
      }
      const user = await db.orm.public.User.where({ id: payload.sub }).first();
      if (!user || !user.isActive || user.email !== payload.email ||
          this.normalizeAccountRole(user.role) !== payload.role) {
        throw new UnauthorizedException('Account unavailable');
      }
      if (['ADMIN','STAFF'].includes(payload.role)) {
        const security = await this.managementSecurity.requireConfigured(user.id);
        if ((payload.credentialVersion ?? 0) !== (security.credential_version ?? 0)) throw new UnauthorizedException('Credentials changed');
      }
      return { ...user, recoveryCredentialVersion: payload.credentialVersion ?? 0 };
    } catch {
      throw new UnauthorizedException('Verification session expired or invalid. Please sign in again.');
    }
  }

  async verifyManagementPin(challengeToken: string, pin: string) {
    const user = await this.verifyPurposeToken(challengeToken, 'pin');
    const security = await this.managementSecurity.verifyPin(user.id, pin);
    const role = this.normalizeAccountRole(user.role);
    if (['ADMIN','STAFF'].includes(role) && user.recoveryCredentialVersion !== (security.credential_version ?? 0)) throw new UnauthorizedException('Credentials changed. Sign in again.');
    const purpose = security.needs_setup ? 'setup' : 'access';
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role, purpose, credentialVersion: ['ADMIN','STAFF'].includes(role) ? security.credential_version ?? 0 : undefined },
      { expiresIn: purpose === 'setup' ? '15m' : '1h' },
    );
    return {
      success: true,
      data: {
        accessToken,
        user: { ...this.safeUser(user), mustCompleteSetup: security.needs_setup, phoneNumber: security.phone_number, avatarUrl:security.avatar_data_url||'' },
      },
    };
  }

  async completeManagementSetup(setupToken: string, body: {
    firstName: string; lastName: string; phoneNumber: string; newPassword: string; newPin: string;
  }) {
    const user = await this.verifyPurposeToken(setupToken, 'setup');
    const details = await this.managementSecurity.finishSetup(user.id, body);
    const role = this.normalizeAccountRole(user.role);
    const accessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role, purpose: 'access', credentialVersion: ['ADMIN','STAFF'].includes(role) ? user.recoveryCredentialVersion : undefined }, { expiresIn: '1h' },
    );
    return { success: true, data: { accessToken, user: { ...this.safeUser(user), ...details, mustCompleteSetup: false } } };
  }

  async checkActionPin(userId: number, pin: string) {
    const security = await this.managementSecurity.verifyPin(userId, pin);
    if (security.needs_setup) throw new ForbiddenException('Complete account setup first');
    return { success: true };
  }

  async updateManagementCredentials(userId: number, body: {
    currentPassword?: string; newPassword?: string; currentPin?: string; newPin?: string;
  }) {
    const result=await this.managementSecurity.changeCredentials(userId,body);
    const profile=await this.getMyProfile(userId);const security=await this.managementSecurity.requireConfigured(userId);
    const accessToken=await this.jwtService.signAsync({sub:userId,email:profile.data.email,role:profile.data.role,purpose:'access',credentialVersion:security.credential_version??0});
    return {...result,data:{...profile.data,accessToken}};
  }

}
