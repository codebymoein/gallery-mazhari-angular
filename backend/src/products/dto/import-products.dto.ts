import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ImportVariationRowDto {
  @IsString()
  @MaxLength(60)
  sku: string;

  @IsString()
  @MaxLength(60)
  barcode: string;

  @IsOptional() @IsString() @MaxLength(40) size?: string;
  @IsOptional() @IsString() @MaxLength(80) color?: string;
  @IsOptional() @IsString() @MaxLength(80) material?: string;
  @IsOptional() @Min(0) price?: number;
  @IsNumber({ allowInfinity: false, allowNaN: false }) @Min(0) stock: number;
  @IsBoolean() available: boolean;
}

export class ImportProductRowDto {
  @IsString()
  @MaxLength(60)
  code: string;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @MaxLength(120)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  parentCategory?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  parentCategorySlug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  categorySlug?: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  stock: number;

  @IsOptional()
  @IsIn(['waiting_photo', 'rejected'])
  status?: 'waiting_photo' | 'rejected';

  @IsOptional()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsBoolean()
  isNewImport?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  size?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  material?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  heelHeight?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  platformHeight?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  variantKey?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportVariationRowDto)
  variations?: ImportVariationRowDto[];
}

export class ImportProductsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportProductRowDto)
  products: ImportProductRowDto[];

  @IsArray()
  @IsString({ each: true })
  removedOutOfStock: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  fileName?: string;
}
