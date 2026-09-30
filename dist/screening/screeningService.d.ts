export declare class ScreeningService {
    private gemini;
    processRequest(requestId: number): Promise<{
        requestId: number;
        status: "NEEDS_ADMIN_REVIEW" | "OPEN" | "REJECTED_FAKE";
        flags: string[];
        finalPriority: number;
    } | undefined>;
    checkStuckScreening(): Promise<number>;
}
export declare const screeningService: ScreeningService;
