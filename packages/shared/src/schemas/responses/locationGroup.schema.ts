import { z } from 'zod';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

export const LocationGroupSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  visibilityStatus: z.enum(Object.values(VISIBILITY_STATUSES) as [string, ...string[]]),
  isBookable: z.boolean(),
  updatedAtSyncTick: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  facilityId: z.string(),
});

export type LocationGroup = z.infer<typeof LocationGroupSchema>;
