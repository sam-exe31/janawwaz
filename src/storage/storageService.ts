import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import exifParser from 'exif-parser';
import { AppError } from '../common/errors';

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

export class LocalDiskStorageService implements StorageService {
  private uploadDir: string;

  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async saveFile(buffer: Buffer, originalName: string): Promise<FileMetadata> {
    const sizeBytes = buffer.length;
    if (sizeBytes > 5 * 1024 * 1024) {
      throw AppError.badRequest('File size exceeds maximum limit of 5 MB');
    }

    const mimeType = this.sniffMimeType(buffer);
    if (!mimeType) {
      throw AppError.badRequest('Unsupported file type. Only JPEG, PNG, WEBP images and MP3, WAV, WEBM, M4A audio allowed.');
    }

    // SHA-256 hash
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');

    // Extract EXIF if JPEG
    let exifLat: number | null = null;
    let exifLng: number | null = null;
    let exifTakenAt: Date | null = null;

    if (mimeType === 'image/jpeg') {
      try {
        const parser = exifParser.create(buffer);
        const result = parser.parse();
        if (result.tags) {
          if (result.tags.GPSLatitude !== undefined && result.tags.GPSLongitude !== undefined) {
            exifLat = Number(result.tags.GPSLatitude.toFixed(6));
            exifLng = Number(result.tags.GPSLongitude.toFixed(6));
          }
          if (result.tags.DateTimeOriginal) {
            exifTakenAt = new Date(result.tags.DateTimeOriginal * 1000);
          }
        }
      } catch (err) {
        // Corrupted or missing EXIF is allowed and treated as neutral
      }
    }

    // Generate unique filename
    const ext = this.getExtension(mimeType, originalName);
    const uploadId = crypto.randomUUID();
    const storedFilename = `${uploadId}${ext}`;
    const destination = path.join(this.uploadDir, storedFilename);

    fs.writeFileSync(destination, buffer);

    const url = `/api/v1/uploads/files/${storedFilename}`;

    // Store in temporary upload cache in DB or memory for later linking
    activeUploads.set(uploadId, {
      uploadId,
      url,
      mimeType,
      sizeBytes,
      sha256,
      exifLat,
      exifLng,
      exifTakenAt,
    });

    return {
      uploadId,
      url,
      mimeType,
      sizeBytes,
      sha256,
      exifLat,
      exifLng,
      exifTakenAt,
    };
  }

  getFilePath(filename: string): string {
    const safeFilename = path.basename(filename); // Prevent path traversal
    return path.join(this.uploadDir, safeFilename);
  }

  private sniffMimeType(buffer: Buffer): string | null {
    if (buffer.length < 4) return null;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    // PNG: 89 50 4E 47
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      return 'image/png';
    }

    // WEBP: RIFF....WEBP
    if (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return 'image/webp';
    }

    // WAV: RIFF....WAVE
    if (
      buffer.length >= 12 &&
      buffer.toString('ascii', 0, 4) === 'RIFF' &&
      buffer.toString('ascii', 8, 12) === 'WAVE'
    ) {
      return 'audio/wav';
    }

    // MP3: ID3 or FF FB / FF F3
    if (buffer.toString('ascii', 0, 3) === 'ID3' || (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) {
      return 'audio/mpeg';
    }

    // WEBM: 1A 45 DF A3
    if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
      return 'audio/webm';
    }

    // M4A: ftyp at offset 4
    if (buffer.length >= 8 && buffer.toString('ascii', 4, 8) === 'ftyp') {
      return 'audio/mp4';
    }

    return null;
  }

  private getExtension(mimeType: string, originalName: string): string {
    switch (mimeType) {
      case 'image/jpeg':
        return '.jpg';
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'audio/mpeg':
        return '.mp3';
      case 'audio/wav':
        return '.wav';
      case 'audio/webm':
        return '.webm';
      case 'audio/mp4':
        return '.m4a';
      default:
        return path.extname(originalName) || '.bin';
    }
  }
}

// In-memory map of uploads before request finalization
export const activeUploads = new Map<string, FileMetadata>();
export const storageService = new LocalDiskStorageService();
