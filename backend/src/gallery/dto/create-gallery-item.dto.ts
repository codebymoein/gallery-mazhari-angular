import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGalleryItemDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsString()
  @MaxLength(300)
  imageUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
