import { z } from 'zod';

export const createRequestSchema = z
  .object({
    categoryId: z.number().int().positive('Category ID must be a positive integer'),
    description: z.string().max(2000, 'Description must not exceed 2000 characters').optional(),
    latitude: z.number().min(-90).max(90, 'Latitude must be between -90 and 90'),
    longitude: z.number().min(-180).max(180, 'Longitude must be between -180 and 180'),
    addressText: z.string().max(300, 'Address text must not exceed 300 characters').optional(),
    photoUploadIds: z.array(z.string().uuid()).max(5, 'Max 5 photos allowed').optional().default([]),
    voiceUploadId: z.string().uuid().optional(),
    inputType: z.enum(['PHOTO', 'GEOTAGGED_PHOTO', 'VOICE']),
  })
  .refine(
    (data) => {
      // If not voice, description is required (min 10 chars)
      if (data.inputType !== 'VOICE') {
        return !!data.description && data.description.trim().length >= 10;
      }
      return true;
    },
    {
      message: 'Description must be at least 10 characters long when input type is not VOICE',
      path: ['description'],
    }
  )
  .refine(
    (data) => {
      // If not voice, at least 1 photo required
      if (data.inputType !== 'VOICE') {
        return data.photoUploadIds && data.photoUploadIds.length >= 1;
      }
      return true;
    },
    {
      message: 'At least one photo is required when input type is PHOTO or GEOTAGGED_PHOTO',
      path: ['photoUploadIds'],
    }
  );
