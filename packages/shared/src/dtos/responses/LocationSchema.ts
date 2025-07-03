import { z } from 'zod';

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type Location = z.infer<typeof LocationSchema>;
