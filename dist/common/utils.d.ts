/**
 * Mask phone numbers in responses to anyone except the owner and admin:
 * Format: +91 ******3210
 */
export declare function maskPhone(phone: string | null | undefined): string | null;
/**
 * Get today's date string in Asia/Kolkata (YYYY-MM-DD)
 */
export declare function getTodayInKolkata(): string;
/**
 * Parse date string from MySQL UTC into a JavaScript Date object
 */
export declare function parseUtcDate(dateVal: string | Date | null | undefined): Date;
/**
 * Validate latitude and longitude within configured bbox
 */
export declare function isWithinGeoBBox(lat: number, lng: number): boolean;
/**
 * Sanitize user text input (strip HTML tags)
 */
export declare function sanitizeText(text: string): string;
/**
 * Check if text consists only of repeated characters (e.g. "aaaaaa", "11111111")
 */
export declare function isRepeatedChars(text: string): boolean;
