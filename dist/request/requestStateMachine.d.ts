import { PoolConnection } from 'mysql2/promise';
import { Role } from '../auth/types';
export type RequestStatus = 'SUBMITTED' | 'SCREENING' | 'OPEN' | 'NEEDS_ADMIN_REVIEW' | 'REJECTED_FAKE' | 'CLAIMED' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED' | 'REJECTED_BY_NGO' | 'ADMIN_IN_PROGRESS';
export interface StateMachineActor {
    id: number | null;
    role: Role | 'SYSTEM';
    isVolunteer?: boolean;
}
export interface TransitionOptions {
    note?: string;
    extra?: {
        handledByAdminId?: number;
        claimId?: number;
        approvedBudget?: number;
        aiFlags?: string[];
    };
}
export declare class RequestStateMachine {
    transition(requestId: number, toStatus: RequestStatus, actor: StateMachineActor, options?: TransitionOptions, existingConn?: PoolConnection): Promise<{
        requestId: number;
        fromStatus: "ADMIN_IN_PROGRESS" | "ASSIGNED" | "CLAIMED" | "COMPLETED" | "IN_PROGRESS" | "NEEDS_ADMIN_REVIEW" | "OPEN" | "REJECTED_BY_NGO" | "REJECTED_FAKE" | "SCREENING" | "SUBMITTED";
        toStatus: RequestStatus;
        success: boolean;
    }>;
    private executeTransition;
    private validateTransition;
    private applyGuards;
    private illegal;
    private createNotifications;
}
export declare const requestStateMachine: RequestStateMachine;
