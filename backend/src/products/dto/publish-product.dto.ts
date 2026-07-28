import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { ProductStatus } from '../entities/product.entity';

export class PublishProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  publishedBy?: string;
}

export class OverrideStatusDto {
  @IsIn(['waiting_photo', 'ready_for_approval', 'published', 'rejected'])
  status: ProductStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  actor?: string;
}
