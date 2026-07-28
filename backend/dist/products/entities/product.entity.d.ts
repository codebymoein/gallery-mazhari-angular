export type ProductStatus = 'waiting_photo' | 'ready_for_approval' | 'published' | 'rejected';
export interface ProductPhoto {
    url: string;
    fileName: string;
    addedAt: string;
}
export declare class ProductEntity {
    id: string;
    code: string;
    name: string;
    category: string;
    parentCategory: string;
    parentCategorySlug: string;
    categorySlug: string;
    stock: number;
    isNewImport: boolean;
    status: ProductStatus;
    photos: ProductPhoto[];
    importedAt?: string | null;
    processedAt?: string | null;
    publishedAt?: string | null;
    processedBy?: string | null;
    publishedBy?: string | null;
    notes?: string | null;
    createdAt: Date;
    updatedAt: Date;
}
