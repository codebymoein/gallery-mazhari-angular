import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class DreamItemDto {
  @IsString() @MaxLength(100) productId: string;
  @IsString() @MaxLength(160) name: string;
}

export class CreateConsultationDto {
  @IsOptional() @IsString() @MaxLength(80) lastName?: string;
  @Matches(/^09\d{9}$/) phone: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) ceremonyDate?: string;
  @IsOptional() @IsIn(['anytime', 'morning', 'afternoon', 'evening']) contactTime?: string;
  @IsOptional() @IsString() @MaxLength(800) message?: string;
  @IsOptional() @IsBoolean() consent?: boolean;
  @IsOptional() @IsString() @MaxLength(40) source?: string;
  @IsOptional() @IsString() @MaxLength(160) productName?: string;
  @IsOptional() @IsString() @MaxLength(100) productId?: string;
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DreamItemDto)
  dreamItems?: DreamItemDto[];
  @IsOptional() @IsString() @MaxLength(200) website?: string;
}

export class UpdateConsultationDto {
  @IsOptional()
  @IsIn(['needs_followup', 'contacted', 'cancelled', 'scheduled'])
  followUpTag?: string;
  @IsOptional() @IsString() @MaxLength(1000) adminNote?: string;
}
