import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';
import { GalleryItemEntity } from './entities/gallery-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GalleryItemEntity])],
  providers: [GalleryService],
  controllers: [GalleryController],
})
export class GalleryModule {}
