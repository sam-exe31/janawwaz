export declare class RankService {
    recalculateNgoRank(ngoId: number): Promise<number>;
    recalculateAllNgos(): Promise<void>;
}
export declare const rankService: RankService;
