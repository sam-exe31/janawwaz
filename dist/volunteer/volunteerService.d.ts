export declare class VolunteerService {
    getAvailableRequests(params: {
        lat?: number;
        lng?: number;
        radiusKm?: number;
        categorySlug?: string;
    }): Promise<{
        id: any;
        categoryId: any;
        categoryName: any;
        categorySlug: any;
        description: any;
        aiSummary: any;
        latitude: number;
        longitude: number;
        addressText: any;
        status: any;
        aiEasy: boolean;
        isEscalated: boolean;
        approvedBudget: number | null;
        finalPriority: number | null;
        citizenName: any;
        citizenPhoneMasked: string | null;
        createdAt: any;
        photos: any[];
    }[]>;
    recordAction(volunteerId: number, requestId: number, outcome: 'CALLED_NO_ANSWER' | 'CALLED_RESOLVED' | 'COORDINATING' | 'ESCALATED' | 'RESOLVED_WITH_PROOF', notes?: string, proofPhotoUrl?: string): Promise<{
        actionId: any;
        requestId: number;
        outcome: "CALLED_NO_ANSWER" | "CALLED_RESOLVED" | "COORDINATING" | "ESCALATED" | "RESOLVED_WITH_PROOF";
        notes: string | null;
        status: any;
    }>;
    submitVerificationRequest(userId: number, motivation?: string): Promise<{
        verificationRequestId: number;
        status: string;
        message: string;
    }>;
    getVerificationStatus(userId: number): Promise<{
        user: any;
        latestApplication: any;
    }>;
}
export declare const volunteerService: VolunteerService;
