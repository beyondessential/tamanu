import { z } from 'zod';

export const FacilitySchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
});

export type Facility = z.infer<typeof FacilitySchema>;
