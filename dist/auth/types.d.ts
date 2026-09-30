export type Role = 'CITIZEN' | 'NGO' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED';
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
export interface JwtUserPayload {
    sub: number;
    role: Role;
    verificationStatus: VerificationStatus;
}
export interface AuthenticatedUser {
    id: number;
    phone: string | null;
    email: string | null;
    role: Role;
    name: string | null;
    status: UserStatus;
    verificationStatus: VerificationStatus;
    sessionId?: number;
}
declare global {
    namespace Express {
        interface Request {
            user?: AuthenticatedUser;
        }
    }
}
