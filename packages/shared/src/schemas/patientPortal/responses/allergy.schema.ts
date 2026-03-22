import { z } from 'zod';

import { ReferenceDataSchema } from './referenceData.schema';

export const AllergySchema = z.object({
  id: z.string(),
  note: z.string().nullish(),
  recordedDate: z.string(),
  allergy: ReferenceDataSchema,
  reaction: ReferenceDataSchema.nullish(),
});

export type Allergy = z.infer<typeof AllergySchema>;
