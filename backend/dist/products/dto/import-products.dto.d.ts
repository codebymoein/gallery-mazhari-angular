export declare class ImportProductRowDto {
    code: string;
    name: string;
    category: string;
    parentCategory?: string;
    parentCategorySlug?: string;
    categorySlug?: string;
    stock: number;
    isNewImport?: boolean;
}
export declare class ImportProductsDto {
    products: ImportProductRowDto[];
    removedOutOfStock: string[];
    fileName?: string;
}
