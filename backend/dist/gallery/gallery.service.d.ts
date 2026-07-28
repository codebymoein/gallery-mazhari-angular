import { Repository } from 'typeorm';
import { CreateGalleryItemDto } from './dto/create-gallery-item.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';
import { UpdateGalleryItemDto } from './dto/update-gallery-item.dto';
import { GalleryItemEntity } from './entities/gallery-item.entity';
export declare class GalleryService {
    private readonly galleryRepository;
    constructor(galleryRepository: Repository<GalleryItemEntity>);
    getAll(query: QueryGalleryDto): Promise<{
        items: GalleryItemEntity[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getById(id: string): Promise<GalleryItemEntity>;
    create(dto: CreateGalleryItemDto): Promise<GalleryItemEntity>;
    update(id: string, dto: UpdateGalleryItemDto): Promise<GalleryItemEntity>;
    remove(id: string): Promise<GalleryItemEntity>;
}
