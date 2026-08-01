import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { CreateGalleryItemDto } from './dto/create-gallery-item.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';
import { UpdateGalleryItemDto } from './dto/update-gallery-item.dto';
import { GalleryItemEntity } from './entities/gallery-item.entity';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(GalleryItemEntity)
    private readonly galleryRepository: Repository<GalleryItemEntity>,
  ) {}

  async getAll(query: QueryGalleryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const search = query.search?.trim();

    const [items, total] = await this.galleryRepository.findAndCount({
      where: search
        ? [
            { title: ILike(`%${search}%`) },
            { description: ILike(`%${search}%`) },
          ]
        : undefined,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const item = await this.galleryRepository.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException('Gallery item not found');
    }

    return item;
  }

  create(dto: CreateGalleryItemDto) {
    const entity = this.galleryRepository.create(dto);
    return this.galleryRepository.save(entity);
  }

  async update(id: string, dto: UpdateGalleryItemDto) {
    const item = await this.getById(id);
    const merged = this.galleryRepository.merge(item, dto);
    return this.galleryRepository.save(merged);
  }

  async remove(id: string) {
    const item = await this.getById(id);
    await this.galleryRepository.remove(item);
    return item;
  }
}
