export interface FileMetadata {
    uploadId: string;
    url: string;
    mimeType: string;
    sizeBytes: number;
    sha256: string;
    exifLat: number | null;
    exifLng: number | null;
    exifTakenAt: Date | null;
}
export interface StorageService {
    saveFile(buffer: Buffer, originalName: string): Promise<FileMetadata>;
    getFilePath(filename: string): string;
}
export declare class LocalDiskStorageService implements StorageService {
    private uploadDir;
    constructor(uploadDir?: string);
    saveFile(buffer: Buffer, originalName: string): Promise<FileMetadata>;
    getFilePath(filename: string): string;
    private sniffMimeType;
    private getExtension;
}
export declare const activeUploads: Map<string, FileMetadata>;
export declare const storageService: LocalDiskStorageService;
