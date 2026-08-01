import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateAppearanceDto {
  @IsOptional() @IsString() @MaxLength(12_000_000) bridalHeroImage?: string;
  @IsOptional() @IsString() @MaxLength(12_000_000) accessoryHeroImage?: string;
  @IsOptional() @IsObject() categoryImages?: Record<string, string>;
  @IsOptional() @IsObject() subcategoryImages?: Record<string, string>;
  @IsOptional() @IsArray() @IsString({ each: true }) categoryOrder?: string[];
  @IsOptional() @IsObject() subcategoryOrder?: Record<string, string[]>;
  @IsOptional() @IsString() @MaxLength(12_000_000) consultationImage?: string;
  @IsOptional() @IsArray() memories?: Array<{
    id: string;
    name: string;
    quote: string;
    venue: string;
    image: string;
    span: 'tall' | 'wide' | 'square';
    active: boolean;
  }>;
}
