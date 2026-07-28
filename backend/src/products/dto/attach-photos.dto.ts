import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class PhotoDto {
  /** آدرس عکس — یا data:URL (فشرده‌شده سمت کلاینت) یا URL کامل */
  @IsString()
  url: string;

  @IsString()
  @MaxLength(200)
  fileName: string;
}

export class AttachPhotosDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PhotoDto)
  photos: PhotoDto[];

  @IsOptional()
  @IsString()
  @MaxLength(120)
  processedBy?: string;
}
