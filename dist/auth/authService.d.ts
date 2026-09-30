import { Role, UserStatus, VerificationStatus } from './types';
export interface UserRecord {
    id: number;
    phone: string | null;
    email: string | null;
    password_hash: string | null;
    role: Role;
    name: string | null;
    status: UserStatus;
    verification_status: VerificationStatus;
    verified_at: string | null;
    verified_by: number | null;
    last_login_at: string | null;
    avatar_url: string | null;
    bio: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
}
export declare class AuthService {
    private otpService;
    requestOtp(phone: string, ip?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(phone: string, code: string, ip?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
        user: {
            id: number;
            phone: string | null;
            email: string | null;
            role: Role;
            name: string | null;
            status: UserStatus;
            verificationStatus: VerificationStatus;
        };
    }>;
    loginWithPassword(emailOrPhone: string, pass: string, ip?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
        user: {
            id: number;
            phone: string | null;
            email: string | null;
            role: Role;
            name: string | null;
            status: UserStatus;
            verificationStatus: VerificationStatus;
        };
    }>;
    registerCitizen(data: {
        name: string;
        email?: string;
        phone?: string;
        password?: string;
    }, ip?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
        user: {
            id: number;
            phone: string | null;
            email: string | null;
            role: Role;
            name: string | null;
            status: UserStatus;
            verificationStatus: VerificationStatus;
        };
    }>;
    registerNgo(data: {
        name: string;
        email: string;
        phone?: string;
        registrationNumber: string;
        description?: string;
        password?: string;
    }, ip?: string, userAgent?: string): Promise<{
        accessToken: string;
        refreshToken: string;
        tokenType: string;
        expiresIn: number;
        user: {
            id: number;
            phone: string | null;
            email: string | null;
            role: Role;
            name: string | null;
            status: UserStatus;
            verificationStatus: VerificationStatus;
        };
    }>;
    refreshTokens(refreshTokenStr: string, ip?: string): Promise<{
        accessToken: string;
        tokenType: string;
        expiresIn: number;
    }>;
    logout(refreshTokenStr: string): Promise<{
        success: boolean;
    }>;
    changePassword(userId: number, oldPass: string, newPass: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private createAuthResponse;
}
export declare const authService: AuthService;
