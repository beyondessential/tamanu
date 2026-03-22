import { z } from 'zod';

export const ProgramSchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  code: z.string().nullish(),
});

export type Program = z.infer<typeof ProgramSchema>;
