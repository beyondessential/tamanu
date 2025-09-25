import { z } from 'zod';

import { FacilitySchema } from './facility.schema';

export const LocationGroupSchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  facility: FacilitySchema,
});

export type LocationGroup = z.infer<typeof LocationGroupSchema>;
