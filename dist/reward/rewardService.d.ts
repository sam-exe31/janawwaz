export declare class RewardService {
    getBalance(userId: number): Promise<number>;
    getHistory(userId: number): Promise<any[]>;
    awardPoints(userId: number, eventType: string, reason: string, requestId?: number | null, grantedBy?: number | null): Promise<{
        awarded: boolean;
        message: string;
        points?: undefined;
    } | {
        message?: undefined;
        awarded: boolean;
        points: number;
    }>;
    manualGrantOrDeduct(adminId: number, userId: number, points: number, reason: string, requestId?: number | null): Promise<{
        success: boolean;
        points: number;
        reason: string;
    }>;
}
export declare const rewardService: RewardService;
