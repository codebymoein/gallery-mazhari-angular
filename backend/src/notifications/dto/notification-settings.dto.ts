import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsBoolean() enabled: boolean;
  @IsIn(['auto', 'telegram', 'sms', 'both', 'disabled']) mode:
    'auto' | 'telegram' | 'sms' | 'both' | 'disabled';
  @IsOptional() @IsString() @MaxLength(200) telegramBotToken?: string;
  @IsArray() @IsString({ each: true }) telegramChatIds: string[];
  @ValidateIf(
    (_, value) => value !== undefined && value !== null && value !== '',
  )
  @IsUrl({ require_tld: false, protocols: ['https'] })
  @MaxLength(500)
  smsApiUrl?: string;
  @IsOptional() @IsString() @MaxLength(500) smsApiKey?: string;
  @IsOptional() @IsString() @MaxLength(80) smsSender?: string;
  @IsArray() @IsString({ each: true }) smsRecipients: string[];
  @IsOptional() @IsString() @MaxLength(50) smsAuthHeader?: string;
  @IsOptional() @IsString() @MaxLength(30) smsAuthScheme?: string;
  @IsInt() @Min(2000) @Max(30000) timeoutMs: number;
}
