import { z } from 'zod';

export const ReferenceDataSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  type: z.string(),
});
