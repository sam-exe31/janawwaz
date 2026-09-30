"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskPhone = maskPhone;
exports.getTodayInKolkata = getTodayInKolkata;
exports.parseUtcDate = parseUtcDate;
exports.isWithinGeoBBox = isWithinGeoBBox;
exports.sanitizeText = sanitizeText;
exports.isRepeatedChars = isRepeatedChars;
const config_1 = require("../config");
/**
 * Mask phone numbers in responses to anyone except the owner and admin:
 * Format: +91 ******3210
 */
function maskPhone(phone) {
    if (!phone)
        return null;
    if (phone.length <= 6)
        return phone;
    const prefix = phone.substring(0, 3);
    const suffix = phone.substring(phone.length - 4);
    return `${prefix} ******${suffix}`;
}
/**
 * Get today's date string in Asia/Kolkata (YYYY-MM-DD)
 */
function getTodayInKolkata() {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: config_1.config.server.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
    return formatter.format(new Date());
}
/**
 * Parse date string from MySQL UTC into a JavaScript Date object
 */
function parseUtcDate(dateVal) {
    if (!dateVal)
        return new Date();
    if (dateVal instanceof Date)
        return dateVal;
    const str = String(dateVal).trim();
    if (!str.endsWith('Z') && !str.includes('+')) {
        return new Date(str.replace(' ', 'T') + 'Z');
    }
    return new Date(str);
}
/**
 * Validate latitude and longitude within configured bbox
 */
function isWithinGeoBBox(lat, lng) {
    const [minLat, minLng, maxLat, maxLng] = config_1.config.geo.bbox;
    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}
/**
 * Sanitize user text input (strip HTML tags)
 */
function sanitizeText(text) {
    return text.replace(/<[^>]*>/g, '').trim();
}
/**
 * Check if text consists only of repeated characters (e.g. "aaaaaa", "11111111")
 */
function isRepeatedChars(text) {
    if (!text || text.length < 3)
        return false;
    const first = text[0];
    for (let i = 1; i < text.length; i++) {
        if (text[i] !== first)
            return false;
    }
    return true;
}
