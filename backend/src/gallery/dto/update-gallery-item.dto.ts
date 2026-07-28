import { PartialType } from '@nestjs/mapped-types';
import { CreateGalleryItemDto } from './create-gallery-item.dto';

export class UpdateGalleryItemDto extends PartialType(CreateGalleryItemDto) {}
