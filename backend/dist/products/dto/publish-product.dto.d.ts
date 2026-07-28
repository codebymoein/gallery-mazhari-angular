import type { ProductStatus } from '../entities/product.entity';
export declare class PublishProductDto {
    publishedBy?: string;
}
export declare class OverrideStatusDto {
    status: ProductStatus;
    actor?: string;
}
