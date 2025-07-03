import { z } from 'zod';
import { ReferenceDataSchema } from './ReferenceDataSchema';

export const AllergySchema = z.object({
  id: z.string(),
  note: z.string().nullable(),
  recordedDate: z.string(),
  patientId: z.string(),
  practitionerId: z.string().nullable(),
  allergyId: z.string(),
  reactionId: z.string().nullable(),
  allergy: ReferenceDataSchema,
  reaction: ReferenceDataSchema.nullable(),
});

export const AllergiesArraySchema = z.array(AllergySchema);
export type Allergy = z.infer<typeof AllergySchema>;
