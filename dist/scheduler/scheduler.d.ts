export declare class Scheduler {
    private intervals;
    startAll(): void;
    stopAll(): void;
    runSlaEscalation(): Promise<number>;
    cleanupExpiredData(): Promise<void>;
    runNightlyRankRecalculation(): Promise<void>;
}
export declare const scheduler: Scheduler;
