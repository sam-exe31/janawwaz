export declare class PublicService {
    recordVisit(hasVisitedToday: boolean): Promise<{
        recorded: boolean;
        count: number;
    }>;
    getCategories(): Promise<any[]>;
    getLeaderboard(period?: string): Promise<any[]>;
    getNgoPublicProfile(ngoId: number): Promise<any>;
    getStats(): Promise<{
        totalRequests: number;
        resolvedRequests: number;
        openRequests: number;
        inProgressRequests: number;
        activeNgos: number;
        avgResolutionHours: number;
        siteVisits: number;
        coverageCity: string;
    }>;
    getPublicFeed(categorySlug?: string, limit?: number): Promise<any[]>;
}
export declare const publicService: PublicService;
