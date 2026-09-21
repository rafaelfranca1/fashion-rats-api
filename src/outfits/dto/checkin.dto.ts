import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, IsUrl, Min } from 'class-validator';

export class CheckinDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  imageUrl?: string;
}
