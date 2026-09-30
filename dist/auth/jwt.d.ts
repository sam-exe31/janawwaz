import { JwtUserPayload } from './types';
export declare function signAccessToken(payload: JwtUserPayload): string;
export declare function verifyAccessToken(token: string): JwtUserPayload;
export declare function signRefreshToken(userId: number, sessionId: number): string;
export declare function verifyRefreshToken(token: string): {
    sub: number;
    sessionId: number;
};
export declare function hashToken(token: string): string;
