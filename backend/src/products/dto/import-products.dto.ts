import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

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

  @IsInt()
  @Min(0)
  stock: number;

  @IsOptional()
  @IsBoolean()
  isNewImport?: boolean;
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
