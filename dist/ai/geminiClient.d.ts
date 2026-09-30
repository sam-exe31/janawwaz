export interface GeminiAnalysisOutput {
    genuine_score: number;
    obvious_junk: boolean;
    photo_matches_category: boolean;
    photo_matches_description: boolean;
    genuine_reasoning: string;
    suggested_category_slug: string;
    category_confidence: number;
    severity_score: number;
    severity_reasoning: string;
    budget_min: number;
    budget_max: number;
    budget_reasoning: string;
    easy_to_fix: boolean;
    summary: string;
}
export interface RequestContext {
    requestId: number;
    categoryName: string;
    categorySlug: string;
    description: string;
    latitude: number;
    longitude: number;
    addressText: string;
    photos: Array<{
        url: string;
        mimeType: string;
        filePath?: string;
    }>;
    categoriesList: string;
}
export interface GeminiClient {
    analyzeRequest(context: RequestContext): Promise<GeminiAnalysisOutput>;
    transcribe(audioBuffer: Buffer, mime: string): Promise<string>;
}
export declare class MockGeminiClient implements GeminiClient {
    analyzeRequest(context: RequestContext): Promise<GeminiAnalysisOutput>;
    transcribe(audioBuffer: Buffer, mime: string): Promise<string>;
}
export declare class GoogleGenAiClient implements GeminiClient {
    private ai;
    private promptTemplate;
    constructor();
    analyzeRequest(context: RequestContext): Promise<GeminiAnalysisOutput>;
    transcribe(audioBuffer: Buffer, mime: string): Promise<string>;
}
export declare function getGeminiClient(): GeminiClient;
export declare function logAiAnalysis(requestId: number, task: string, model: string, outputJson: any, latencyMs: number, success: boolean, errorMessage?: string | null): Promise<void>;
