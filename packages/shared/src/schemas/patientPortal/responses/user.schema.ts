import { z } from 'zod';

// Represents clinicians etc. (located in users table)
export const UserSchema = z.object({
  id: z.string(),
  displayName: z.string(),
});

export type User = z.infer<typeof UserSchema>;
