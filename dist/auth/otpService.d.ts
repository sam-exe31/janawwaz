export interface OtpService {
    requestOtp(phone: string, ip?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(phone: string, code: string): Promise<boolean>;
}
export declare class DummyOtpService implements OtpService {
    requestOtp(phone: string, ip?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(phone: string, code: string): Promise<boolean>;
}
export declare class SmsOtpService implements OtpService {
    requestOtp(phone: string, ip?: string): Promise<{
        success: boolean;
        message: string;
    }>;
    verifyOtp(phone: string, code: string): Promise<boolean>;
}
export declare function getOtpService(): OtpService;
