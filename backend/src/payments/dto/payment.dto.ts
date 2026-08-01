import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsEmail,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class UpdatePaymentSettingsDto {
  @IsIn(['disabled', 'zarinpal', 'custom'])
  provider: 'disabled' | 'zarinpal' | 'custom';

  @IsBoolean()
  enabled: boolean;

  @IsString()
  @MaxLength(100)
  displayName: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  merchantId?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(500)
  customRequestUrl?: string;

  @IsOptional()
  @IsUrl({ require_protocol: true, protocols: ['https'] })
  @MaxLength(500)
  customVerifyUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customPaymentUrlTemplate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  customApiKey?: string;

  @IsBoolean()
  sandbox: boolean;
}

export class PaymentItemDto {
  @IsString()
  @MaxLength(60)
  code: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  quantity: number;

  @IsOptional()
  @IsIn(['engraving', 'veil-print'])
  customization?: 'engraving' | 'veil-print';
}

export class PaymentCustomerDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  firstName = '';

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  lastName: string;

  @IsString()
  @Matches(/^09\d{9}$/)
  phone: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email = '';

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  city: string;

  @IsString()
  @MinLength(5)
  @MaxLength(300)
  address: string;

  @IsOptional()
  @Matches(/^\d{10}$/)
  postalCode = '';
}

export class CreatePaymentDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentItemDto)
  items: PaymentItemDto[];

  @IsIn(['standard', 'express', 'pickup'])
  shippingMethod: 'standard' | 'express' | 'pickup';

  @ValidateNested()
  @Type(() => PaymentCustomerDto)
  customer: PaymentCustomerDto;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
