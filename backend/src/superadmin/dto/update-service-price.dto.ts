
import { IsNumber, Min } from 'class-validator';

export class UpdateServicePriceDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  price!: number;
}
