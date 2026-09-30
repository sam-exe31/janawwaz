export declare class NgoService {
    getNgoByUserId(userId: number): Promise<any>;
    getOpenRequestsInArea(ngoId: number, page?: number, size?: number): Promise<{
        items: any[];
        total: number;
    }>;
    claimRequest(ngoId: number, requestId: number): Promise<{
        claimId: any;
        requestId: number;
        status: string;
        message: string;
    }>;
    rejectRequest(ngoId: number, requestId: number, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
    abandonClaim(ngoId: number, claimId: number, reason: string): Promise<{
        success: boolean;
        message: string;
    }>;
    getHelperSuggestions(ngoId: number, claimId: number): Promise<any[]>;
    assignHelper(ngoId: number, claimId: number, helperId: number, note?: string): Promise<{
        assignmentId: any;
        helperName: any;
        status: string;
    }>;
    startWork(ngoId: number, claimId: number): Promise<{
        success: boolean;
        status: string;
    }>;
    attachProofPhoto(ngoId: number, claimId: number, kind: 'BEFORE' | 'AFTER', uploadId: string): Promise<{
        photoId: number;
        kind: "AFTER" | "BEFORE";
        url: string;
    }>;
    completeWork(ngoId: number, claimId: number): Promise<{
        success: boolean;
        status: string;
        message: string;
    }>;
    getHeatMap(ngoId: number, precision?: number): Promise<{
        lat: number;
        lng: number;
        count: number;
        avgPriority: number;
        topCategory: any;
    }[]>;
}
export declare const ngoService: NgoService;
