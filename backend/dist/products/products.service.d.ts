import { Repository } from 'typeorm';
import { AttachPhotosDto } from './dto/attach-photos.dto';
import { ImportProductsDto } from './dto/import-products.dto';
import { OverrideStatusDto, PublishProductDto } from './dto/publish-product.dto';
import { ProductEntity } from './entities/product.entity';
export declare const MAX_PRODUCT_PHOTOS = 5;
export declare class ProductsService {
    private readonly repo;
    constructor(repo: Repository<ProductEntity>);
    getQueue(): Promise<ProductEntity[]>;
    getPublished(): Promise<ProductEntity[]>;
    applyImport(dto: ImportProductsDto): Promise<{
        added: number;
        updated: number;
        removed: number;
        queue: ProductEntity[];
    }>;
    attachPhotos(id: string, dto: AttachPhotosDto, uploadsBaseUrl: string): Promise<ProductEntity>;
    removePhoto(id: string, index: number): Promise<ProductEntity>;
    publish(id: string, dto: PublishProductDto): Promise<ProductEntity>;
    overrideStatus(id: string, dto: OverrideStatusDto): Promise<ProductEntity>;
    private getById;
    private persistPhotoUrl;
}
