export interface AppConfig {
    server: {
        port: number;
        env: string;
        timezone: string;
        cookieSecret: string;
    };
    db: {
        host: string;
        port: number;
        user: string;
        password: string;
        database: string;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        accessExpirationMinutes: number;
        refreshExpirationDays: number;
    };
    admin: {
        email: string;
        initialPassword: string;
    };
    otp: {
        mode: 'DUMMY' | 'REAL';
        dummyCode: string;
        whitelist: string[];
    };
    citizen: {
        maxRequestsPerDay: number;
        cooldownMinutes: number;
        maxPhotos: number;
    };
    screening: {
        genuineThreshold: number;
        junkThreshold: number;
        exif: {
            maxDistanceMeters: number;
        };
        priorityWeights: {
            category: number;
            severity: number;
            cluster: number;
        };
    };
    cluster: {
        radiusMeters: number;
        maxSizeForPriority: number;
    };
    request: {
        rejectThreshold: number;
    };
    ngo: {
        maxClaimsPerDay: number;
        maxConcurrentClaims: number;
    };
    helper: {
        maxActiveAssignments: number;
    };
    sla: {
        escalationHours: number;
    };
    rating: {
        windowDays: number;
    };
    rank: {
        w1: number;
        w2: number;
        w3: number;
        w4: number;
        w5: number;
    };
    volunteer: {
        easyBudgetMax: number;
        maxActionsPerDay: number;
    };
    reward: {
        dailyAutoCap: number;
    };
    session: {
        activeWindowMinutes: number;
    };
    gemini: {
        model: string;
        apiKey: string;
        timeoutSeconds: number;
        maxRetries: number;
    };
    geo: {
        bbox: [number, number, number, number];
    };
}
export declare const config: AppConfig;
