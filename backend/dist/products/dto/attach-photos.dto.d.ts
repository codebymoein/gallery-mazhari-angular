export declare class PhotoDto {
    url: string;
    fileName: string;
}
export declare class AttachPhotosDto {
    photos: PhotoDto[];
    processedBy?: string;
}
