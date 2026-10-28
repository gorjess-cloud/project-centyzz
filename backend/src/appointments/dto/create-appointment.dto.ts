import {
  IsEmail,
  IsOptional,
  IsArray,
  ArrayMinSize,
  ArrayMaxSize,
  ArrayUnique,
  ValidateIf,
  IsUUID,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAppointmentDto {
  @ValidateIf((o) => o.serviceIds === undefined)
  @IsInt()
  @Min(1)
  serviceId?: number;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(1, { each: true })
  serviceIds?: number[];

  @IsOptional()
  @IsUUID()
  idempotencyKey?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  customerName: string;

  @IsEmail()
  @MaxLength(255)
  customerEmail: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  appointmentDate: string;

  @IsString()
  @Matches(/^(?:[01]\d|2[0-3]):[0-5]\d$/)
  startTime: string;
}
