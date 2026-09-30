export interface CreateHelperDto {
    name: string;
    phone: string;
    latitude: number;
    longitude: number;
    areaLabel?: string;
    photoUrl?: string;
}
export declare class HelperService {
    listHelpers(ngoId: number): Promise<any[]>;
    createHelper(ngoId: number, dto: CreateHelperDto): Promise<{
        id: number;
        name: string;
        message: string;
    }>;
    updateHelper(ngoId: number, helperId: number, dto: Partial<CreateHelperDto>): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteHelper(ngoId: number, helperId: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
export declare const helperService: HelperService;
