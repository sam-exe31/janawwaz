import { z } from 'zod';
export declare const createRequestSchema: z.ZodObject<{
    categoryId: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    addressText: z.ZodOptional<z.ZodString>;
    photoUploadIds: z.ZodDefault<z.ZodOptional<z.ZodArray<z.ZodString>>>;
    voiceUploadId: z.ZodOptional<z.ZodString>;
    inputType: z.ZodEnum<{
        GEOTAGGED_PHOTO: "GEOTAGGED_PHOTO";
        PHOTO: "PHOTO";
        VOICE: "VOICE";
    }>;
}, z.core.$strip>;
