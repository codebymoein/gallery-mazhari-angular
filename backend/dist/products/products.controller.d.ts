import { AttachPhotosDto } from './dto/attach-photos.dto';
import { ImportProductsDto } from './dto/import-products.dto';
import { OverrideStatusDto, PublishProductDto } from './dto/publish-product.dto';
import { ProductsService } from './products.service';
interface RequestLike {
    protocol: string;
    get(header: string): string | undefined;
}
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    published(): Promise<import("./entities/product.entity").ProductEntity[]>;
    queue(): Promise<import("./entities/product.entity").ProductEntity[]>;
    applyImport(dto: ImportProductsDto): Promise<{
        added: number;
        updated: number;
        removed: number;
        queue: import("./entities/product.entity").ProductEntity[];
    }>;
    attachPhotos(id: string, dto: AttachPhotosDto, req: RequestLike): Promise<import("./entities/product.entity").ProductEntity>;
    removePhoto(id: string, index: number): Promise<import("./entities/product.entity").ProductEntity>;
    publish(id: string, dto: PublishProductDto): Promise<import("./entities/product.entity").ProductEntity>;
    overrideStatus(id: string, dto: OverrideStatusDto): Promise<import("./entities/product.entity").ProductEntity>;
}
export {};
