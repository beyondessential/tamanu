import { z } from 'zod';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

export const DepartmentSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  visibilityStatus: z.enum(Object.values(VISIBILITY_STATUSES) as [string, ...string[]]),
  updatedAtSyncTick: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
  facilityId: z.string(),
});

export type Department = z.infer<typeof DepartmentSchema>;
