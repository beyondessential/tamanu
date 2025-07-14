import { z } from 'zod';
import { VISIBILITY_STATUSES } from '@tamanu/constants';

export const UserSchema = z.object({
  id: z.string(),
  displayId: z.string().nullable(),
  email: z.string(),
  displayName: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: z.string(),
  phoneNumber: z.string().nullable(),
  visibilityStatus: z.enum(Object.values(VISIBILITY_STATUSES) as [string, ...string[]]),
  updatedAtSyncTick: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;
