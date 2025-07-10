import { z } from 'zod';
import { VISIBILITY_STATUSES, REFERENCE_TYPES } from '@tamanu/constants';

export const ReferenceDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.enum(Object.values(REFERENCE_TYPES) as [string, ...string[]]),
  visibilityStatus: z.enum(Object.values(VISIBILITY_STATUSES) as [string, ...string[]]),
  updatedAtSyncTick: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export type ReferenceData = z.infer<typeof ReferenceDataSchema>;
