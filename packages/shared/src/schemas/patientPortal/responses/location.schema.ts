import { z } from 'zod';
import { FacilitySchema } from './facility.schema';

export const LocationSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  facility: FacilitySchema,
});

export type Location = z.infer<typeof LocationSchema>;
