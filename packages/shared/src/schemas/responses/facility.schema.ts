import { z } from 'zod';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

export const FacilitySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  email: z.string().nullable(),
  contactNumber: z.string().nullable(),
  streetAddress: z.string().nullable(),
  cityTown: z.string().nullable(),
  division: z.string().nullable(),
  type: z.string().nullable(),
  visibilityStatus: z.enum(Object.values(VISIBILITY_STATUSES) as [string, ...string[]]),
  updatedAtSyncTick: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  catchmentId: z.string().nullable(),
});

export type Facility = z.infer<typeof FacilitySchema>;
