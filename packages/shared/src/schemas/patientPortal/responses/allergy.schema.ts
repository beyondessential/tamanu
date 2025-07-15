import { z } from 'zod';

import { ReferenceDataSchema } from './referenceData.schema';

export const AllergySchema = z.object({
  id: z.string(),
  note: z.string().optional(),
  recordedDate: z.string(),
  allergy: ReferenceDataSchema,
  reaction: ReferenceDataSchema.optional(),
});

export type Allergy = z.infer<typeof AllergySchema>;
