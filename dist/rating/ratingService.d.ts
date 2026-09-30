export declare class RatingService {
    submitRating(citizenId: number, requestId: number, stars: number, comment?: string): Promise<{
        ratingId: any;
        requestId: number;
        ngoId: any;
        stars: number;
        comment: string | null;
        newNgoAvgRating: number;
    }>;
    getRatingForRequest(requestId: number): Promise<any>;
}
export declare const ratingService: RatingService;
