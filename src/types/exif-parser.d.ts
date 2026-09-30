declare module 'exif-parser' {
  export interface ExifParser {
    parse(): {
      tags: {
        GPSLatitude?: number;
        GPSLongitude?: number;
        DateTimeOriginal?: number;
        [key: string]: any;
      };
    };
  }

  export function create(buffer: Buffer): ExifParser;
}
