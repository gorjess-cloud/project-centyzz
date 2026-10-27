import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class ManagementPinDto {
  @IsString() @IsNotEmpty() challengeToken: string;
  @IsString() @Matches(/^\d{6}$/) pin: string;
}

export class ManagementSetupDto {
  @IsString() @IsNotEmpty() setupToken: string;
  @IsString() @MinLength(2) @MaxLength(100) firstName: string;
  @IsString() @MinLength(2) @MaxLength(100) lastName: string;
  @IsString() @Matches(/^\+?[\d\s()-]{7,20}$/) phoneNumber: string;
  @IsString() @MinLength(12) newPassword: string;
  @IsString() @Matches(/^\d{6}$/) newPin: string;
}

export class ManagementCredentialsDto {
  @IsOptional() @IsString() currentPassword?: string;
  @IsOptional() @IsString() newPassword?: string;
  @IsOptional() @IsString() @Matches(/^\d{6}$/) currentPin?: string;
  @IsOptional() @IsString() @Matches(/^\d{6}$/) newPin?: string;
}
