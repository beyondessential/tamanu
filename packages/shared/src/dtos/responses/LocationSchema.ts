import { z } from 'zod';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { FacilitySchema } from './FacilitySchema';
import { LocationGroupSchema } from './LocationGroupSchema';

export const LocationSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  visibilityStatus: z.enum(Object.values(VISIBILITY_STATUSES) as [string, ...string[]]),
  maxOccupancy: z.number().nullable(),
  updatedAtSyncTick: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  facilityId: z.string(),
  locationGroupId: z.string(),
  locationGroup: LocationGroupSchema.nullable(),
  facility: FacilitySchema.nullable(),
});

export type Location = z.infer<typeof LocationSchema>;
