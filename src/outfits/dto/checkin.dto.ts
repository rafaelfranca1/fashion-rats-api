import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CheckinDto {
  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsUrl({ require_tld: false, protocols: ['http', 'https'] })
  imageUrl?: string;
}
