import { Body, Controller, Post } from '@nestjs/common';
import { IsIn, IsString, Matches, MaxLength } from 'class-validator';
import { CredentialRecoveryService } from './credential-recovery.service.js';
import type { RecoveryKind } from './credential-recovery.service.js';

export class CompleteCredentialRecoveryDto {
  @IsIn(['password','pin']) kind: RecoveryKind;
  @IsString() @Matches(/^[A-Za-z0-9_-]{43}$/) token: string;
  @IsString() @MaxLength(128) newValue: string;
  @IsString() @MaxLength(128) confirmValue: string;
}

// Possession of the random, expiring email token authorizes this one reset only.
// Opening the link never changes or consumes a credential.
@Controller('api/admin/credential-recovery')
export class CredentialRecoveryController {
  constructor(private readonly recovery: CredentialRecoveryService) {}
  @Post('complete')
  complete(@Body() body: CompleteCredentialRecoveryDto) {
    return this.recovery.complete(body.kind,body.token,body.newValue,body.confirmValue);
  }
}
