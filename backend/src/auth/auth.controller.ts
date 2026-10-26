
import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { AuthenticatedRequest } from './jwt-auth.guard.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { GoogleLoginDto } from './dto/google-login.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { ManagementPinDto, ManagementSetupDto, ManagementCredentialsDto } from './dto/management-security.dto.js';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('verify-email')
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyProfile(@Req() request: AuthenticatedRequest) {
    return this.authService.getMyProfile(request.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMyProfile(
    @Body() profile: UpdateProfileDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.authService.updateMyProfile(request.user.sub, profile);
  }

  @Post('google')
  googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto.idToken);
  }

  // Management roles do NOT receive a normal session until PIN verification succeeds.
  @Post('verify-management-pin')
  verifyManagementPin(@Body() dto: ManagementPinDto) {
    return this.authService.verifyManagementPin(dto.challengeToken, dto.pin);
  }

  @Post('complete-management-setup')
  completeManagementSetup(@Body() dto: ManagementSetupDto) {
    return this.authService.completeManagementSetup(dto.setupToken, dto);
  }

  @Post('check-action-pin')
  @UseGuards(JwtAuthGuard)
  checkActionPin(@Req() request: AuthenticatedRequest, @Body('pin') pin: string) {
    return this.authService.checkActionPin(request.user.sub, pin);
  }

  @Patch('management-credentials')
  @UseGuards(JwtAuthGuard)
  updateManagementCredentials(@Req() request: AuthenticatedRequest, @Body() body: ManagementCredentialsDto) {
    return this.authService.updateManagementCredentials(request.user.sub, body);
  }

  @Post('forgot-password')
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.otp,
      resetPasswordDto.newPassword,
    );
  }
}
