import { IsEmail, IsInt, IsNotEmpty, IsString, IsUUID, Matches, MaxLength, Min } from 'class-validator';

export class GuestCheckoutDto {
  @IsInt() @Min(1) serviceId: number;
  @IsUUID() stylistId: string;
  @IsString() @Matches(/^\d{4}-\d{2}-\d{2}$/) appointmentDate: string;
  @IsString() @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/) startTime: string;
  @IsString() @IsNotEmpty() @MaxLength(150) customerName: string;
  @IsEmail() @MaxLength(255) customerEmail: string;
  @IsString() @Matches(/^[+\d() .-]{7,30}$/) customerPhone: string;
}
export class DemoFinishDto {
  @IsString() @IsNotEmpty() token: string;
}
