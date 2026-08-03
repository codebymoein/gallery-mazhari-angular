import { IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateCustomRequestDto {
  @IsIn(['veil', 'dress', 'home-trial']) type: 'veil' | 'dress' | 'home-trial';
  @IsOptional() @IsString() @MaxLength(100) fullName?: string;
  @Matches(/^09\d{9}$/) phone: string;
  @IsOptional() @IsString() @MaxLength(160) email?: string;
  @IsOptional() @IsString() @MaxLength(80) city?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) ceremonyDate?: string;
  @IsOptional() @IsIn(['anytime', 'morning', 'afternoon', 'evening']) contactTime?: string;
  @IsOptional() @IsIn(['phone', 'whatsapp', 'telegram']) preferredContact?: string;
  @IsOptional() @IsString() @MaxLength(160) modelTitle?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsString() @MaxLength(80) color?: string;
  @IsOptional() @IsString() @MaxLength(120) fabric?: string;
  @IsOptional() @IsString() @MaxLength(80) sizeOrLength?: string;
  @IsOptional() @IsString() @MaxLength(120) budget?: string;
  @IsOptional() @IsString() @MaxLength(200) website?: string;
}

export class UpdateCustomRequestDto {
  @IsOptional() @IsIn(['new', 'reviewing', 'estimated', 'contacted', 'cancelled']) status?: string;
  @IsOptional() @IsString() @MaxLength(1000) adminNote?: string;
}
