import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type { DiscountScope } from '../entities/discount-rule.entity';

export class CreateDiscountRuleDto {
  @IsString() @MaxLength(120) title: string;
  @IsOptional() @IsString() @MaxLength(200) subtitle?: string;
  @IsIn(['category', 'subcategory', 'product']) scopeType: DiscountScope;
  @IsString() @MaxLength(160) targetKey: string;
  @IsString() @MaxLength(160) targetLabel: string;
  @IsInt() @Min(1) @Max(99) percent: number;
  @IsOptional() @IsString() @MaxLength(40) badgeText?: string;
  @IsOptional() @IsInt() @Min(-1000) @Max(1000) priority?: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsBoolean() showOnHome?: boolean;
  @IsOptional() @IsString() startsAt?: string | null;
  @IsOptional() @IsString() endsAt?: string | null;
}

export class UpdateDiscountRuleDto extends CreateDiscountRuleDto {}
