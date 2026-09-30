"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function parseNumber(val, defaultValue) {
    if (val === undefined || val === '')
        return defaultValue;
    const num = Number(val);
    return isNaN(num) ? defaultValue : num;
}
function parseArray(val, defaultValue) {
    if (!val)
        return defaultValue;
    return val.split(',').map((s) => s.trim()).filter(Boolean);
}
function parseBBox(val, defaultValue) {
    if (!val)
        return defaultValue;
    const parts = val.split(',').map((s) => Number(s.trim()));
    if (parts.length === 4 && parts.every((n) => !isNaN(n))) {
        return [parts[0], parts[1], parts[2], parts[3]];
    }
    return defaultValue;
}
exports.config = {
    server: {
        port: parseNumber(process.env.PORT, 8080),
        env: process.env.NODE_ENV || 'development',
        timezone: process.env.APP_TIMEZONE || 'Asia/Kolkata',
        cookieSecret: process.env.COOKIE_SECRET || 'civic_cookie_secret_key_32bytes_min',
    },
    db: {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseNumber(process.env.DB_PORT, 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || 'mysql',
        database: process.env.DB_NAME || 'janawwaz_db',
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_bytes_long_civic_platform!',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'super_secret_refresh_jwt_key_at_least_32_bytes_long_civic_platform!',
        accessExpirationMinutes: parseNumber(process.env.JWT_ACCESS_EXPIRATION_MINUTES, 15),
        refreshExpirationDays: parseNumber(process.env.JWT_REFRESH_EXPIRATION_DAYS, 7),
    },
    admin: {
        email: process.env.ADMIN_EMAIL || 'admin@civic.gov.in',
        initialPassword: process.env.ADMIN_INITIAL_PASSWORD || 'Admin@123456',
    },
    otp: {
        mode: process.env.OTP_MODE || 'DUMMY',
        dummyCode: process.env.OTP_DUMMY_CODE || '123456',
        whitelist: parseArray(process.env.OTP_WHITELIST, [
            '+919000000001',
            '+919000000002',
            '+919000000003',
            '+919000000004',
            '+919000000005',
            '+919000000006',
            '+919000000007',
            '+919000000008',
            '+919000000009',
            '+919000000010',
        ]),
    },
    citizen: {
        maxRequestsPerDay: parseNumber(process.env.CITIZEN_MAX_REQUESTS_PER_DAY, 3),
        cooldownMinutes: parseNumber(process.env.CITIZEN_COOLDOWN_MINUTES, 10),
        maxPhotos: parseNumber(process.env.CITIZEN_MAX_PHOTOS, 5),
    },
    screening: {
        genuineThreshold: parseNumber(process.env.SCREENING_GENUINE_THRESHOLD, 0.6),
        junkThreshold: parseNumber(process.env.SCREENING_JUNK_THRESHOLD, 0.15),
        exif: {
            maxDistanceMeters: parseNumber(process.env.SCREENING_EXIF_MAX_DISTANCE_METERS, 300),
        },
        priorityWeights: {
            category: parseNumber(process.env.SCREENING_WEIGHT_CATEGORY, 0.4),
            severity: parseNumber(process.env.SCREENING_WEIGHT_SEVERITY, 0.4),
            cluster: parseNumber(process.env.SCREENING_WEIGHT_CLUSTER, 0.2),
        },
    },
    cluster: {
        radiusMeters: parseNumber(process.env.CLUSTER_RADIUS_METERS, 100),
        maxSizeForPriority: parseNumber(process.env.CLUSTER_MAX_SIZE_FOR_PRIORITY, 10),
    },
    request: {
        rejectThreshold: parseNumber(process.env.REQUEST_REJECT_THRESHOLD, 3),
    },
    ngo: {
        maxClaimsPerDay: parseNumber(process.env.NGO_MAX_CLAIMS_PER_DAY, 5),
        maxConcurrentClaims: parseNumber(process.env.NGO_MAX_CONCURRENT_CLAIMS, 5),
    },
    helper: {
        maxActiveAssignments: parseNumber(process.env.HELPER_MAX_ACTIVE_ASSIGNMENTS, 3),
    },
    sla: {
        escalationHours: parseNumber(process.env.SLA_ESCALATION_HOURS, 48),
    },
    rating: {
        windowDays: parseNumber(process.env.RATING_WINDOW_DAYS, 14),
    },
    rank: {
        w1: parseNumber(process.env.RANK_W1, 1.0),
        w2: parseNumber(process.env.RANK_W2, 10),
        w3: parseNumber(process.env.RANK_W3, 5),
        w4: parseNumber(process.env.RANK_W4, 15),
        w5: parseNumber(process.env.RANK_W5, 0.5),
    },
    volunteer: {
        easyBudgetMax: parseNumber(process.env.VOLUNTEER_EASY_BUDGET_MAX, 2000),
        maxActionsPerDay: parseNumber(process.env.VOLUNTEER_MAX_ACTIONS_PER_DAY, 20),
    },
    reward: {
        dailyAutoCap: parseNumber(process.env.REWARD_DAILY_AUTO_CAP, 50),
    },
    session: {
        activeWindowMinutes: parseNumber(process.env.SESSION_ACTIVE_WINDOW_MINUTES, 15),
    },
    gemini: {
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        apiKey: process.env.GEMINI_API_KEY || '',
        timeoutSeconds: parseNumber(process.env.GEMINI_TIMEOUT_SECONDS, 20),
        maxRetries: parseNumber(process.env.GEMINI_MAX_RETRIES, 2),
    },
    geo: {
        bbox: parseBBox(process.env.GEO_BBOX, [6.0, 68.0, 37.5, 98.0]),
    },
};
