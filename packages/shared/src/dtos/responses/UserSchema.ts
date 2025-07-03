import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
});

export type User = z.infer<typeof UserSchema>;
