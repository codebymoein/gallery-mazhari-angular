import { GalleryService } from './gallery.service';
import { CreateGalleryItemDto } from './dto/create-gallery-item.dto';
import { QueryGalleryDto } from './dto/query-gallery.dto';
import { UpdateGalleryItemDto } from './dto/update-gallery-item.dto';
export declare class GalleryController {
    private readonly galleryService;
    constructor(galleryService: GalleryService);
    list(query: QueryGalleryDto): Promise<{
        items: import("./entities/gallery-item.entity").GalleryItemEntity[];
        meta: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getOne(id: string): Promise<import("./entities/gallery-item.entity").GalleryItemEntity>;
    create(dto: CreateGalleryItemDto): Promise<import("./entities/gallery-item.entity").GalleryItemEntity>;
    update(id: string, dto: UpdateGalleryItemDto): Promise<import("./entities/gallery-item.entity").GalleryItemEntity>;
    remove(id: string): Promise<import("./entities/gallery-item.entity").GalleryItemEntity>;
    uploadImage(file: {
        filename: string;
        mimetype: string;
    } | undefined, req: {
        protocol: string;
        get(header: string): string | undefined;
    }): {
        imageUrl: string;
        filename: string;
    };
}
