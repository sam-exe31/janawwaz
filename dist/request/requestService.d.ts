import { AuthenticatedUser } from '../auth/types';
export interface CreateRequestDto {
    categoryId: number;
    description?: string;
    latitude: number;
    longitude: number;
    addressText?: string;
    photoUploadIds?: string[];
    voiceUploadId?: string;
    inputType: 'PHOTO' | 'GEOTAGGED_PHOTO' | 'VOICE';
}
export declare class RequestService {
    submitRequest(citizenId: number, dto: CreateRequestDto): Promise<{
        id: any;
        status: string;
        message: string;
    }>;
    getCitizenRequests(citizenId: number, page?: number, size?: number): Promise<{
        items: any[];
        total: number;
    }>;
    getRequestById(requestId: number, caller: AuthenticatedUser): Promise<{
        id: any;
        citizenId: any;
        citizenName: any;
        citizenPhone: any;
        categoryId: any;
        categoryName: any;
        categorySlug: any;
        inputType: any;
        source: any;
        description: any;
        aiSummary: any;
        latitude: number;
        longitude: number;
        addressText: any;
        status: any;
        clusterId: any;
        isClusterParent: boolean;
        finalPriority: number | null;
        aiBudgetMin: number | null;
        aiBudgetMax: number | null;
        approvedBudget: number | null;
        voiceUrl: any;
        escalatedAt: any;
        closedAt: any;
        createdAt: any;
        photos: any[];
    }>;
    getRequestHistory(requestId: number): Promise<any[]>;
}
export declare const requestService: RequestService;
