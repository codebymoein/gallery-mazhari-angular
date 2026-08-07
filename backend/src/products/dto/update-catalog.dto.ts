import {
  IsArray,
  IsBoolean,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateCatalogDto {
  @IsString()
  @MaxLength(120)
  category: string;

  @IsString()
  @MaxLength(120)
  categorySlug: string;

  @IsString()
  @MaxLength(120)
  parentCategory: string;

  @IsString()
  @MaxLength(120)
  parentCategorySlug: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  collection?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  hiddenTags?: string[];

  @IsOptional()
  @IsBoolean()
  modelSelectionEnabled?: boolean;

  @IsISO8601()
  expectedUpdatedAt: string;
}
