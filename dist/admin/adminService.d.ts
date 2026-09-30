import { RequestStatus } from '../request/requestStateMachine';
export declare class AdminService {
    getDashboard(): Promise<{
        citizens: {
            total: number;
            verified: number;
            suspended: number;
            currentlyLoggedIn: number;
        };
        ngos: {
            total: number;
            verified: number;
        };
        requestsByStatus: any;
        requestsByCategory: any[];
        visitorHistory: any[];
    }>;
    getProgress(): Promise<{
        completed: {
            count: number;
        };
        pending: {
            count: number;
            escalatedCount: number;
        };
        inProcess: {
            count: number;
        };
        rejectedByNgo: {
            count: number;
        };
    }>;
    getRequests(filters: {
        status?: string;
        category?: string;
        flag?: string;
        escalated?: boolean;
    }, page?: number, size?: number): Promise<{
        items: any[];
        total: number;
    }>;
    getAdminRequestDetails(requestId: number): Promise<any>;
    approveRequest(adminId: number, requestId: number, note: string): Promise<{
        success: boolean;
        status: string;
    }>;
    markFake(adminId: number, requestId: number, note: string): Promise<{
        success: boolean;
        status: string;
    }>;
    setCategory(adminId: number, requestId: number, categoryId: number, note: string): Promise<{
        success: boolean;
        categoryId: number;
    }>;
    setBudget(adminId: number, requestId: number, approvedBudget: number, note: string): Promise<{
        success: boolean;
        approvedBudget: number;
    }>;
    closeRequest(adminId: number, requestId: number, note: string): Promise<{
        success: boolean;
        status: string;
    }>;
    releaseClaim(adminId: number, requestId: number, note: string): Promise<{
        success: boolean;
        status: string;
        message: string;
    }>;
    takeOver(adminId: number, requestId: number, note: string): Promise<{
        success: boolean;
        status: string;
    }>;
    rejectProof(adminId: number, requestId: number, note: string): Promise<{
        success: boolean;
        status: string;
    }>;
    overrideStatus(adminId: number, requestId: number, toStatus: RequestStatus, note: string): Promise<{
        success: boolean;
        status: RequestStatus;
    }>;
    listNgos(): Promise<any[]>;
    createNgo(data: {
        name: string;
        email: string;
        registrationNumber: string;
        contactPhone?: string;
        description?: string;
        latitude: number;
        longitude: number;
        serviceRadiusKm?: number;
        areaLabel?: string;
    }): Promise<{
        ngoId: any;
        userId: any;
        email: string;
        temporaryPassword: string;
        message: string;
    }>;
    softDeleteNgo(adminId: number, ngoId: number): Promise<{
        success: boolean;
        message: string;
    }>;
    listCitizens(filters: {
        verificationStatus?: string;
        search?: string;
    }, page?: number, size?: number): Promise<{
        items: any[];
        total: number;
    }>;
    verifyCitizen(adminId: number, citizenId: number, note?: string): Promise<{
        success: boolean;
        verificationStatus: string;
    }>;
    suspendCitizen(adminId: number, citizenId: number, note?: string): Promise<{
        success: boolean;
        status: string;
    }>;
    reactivateCitizen(adminId: number, citizenId: number): Promise<{
        success: boolean;
        status: string;
    }>;
    getAuditLog(page?: number, size?: number): Promise<{
        items: any[];
        total: number;
    }>;
}
export declare const adminService: AdminService;
