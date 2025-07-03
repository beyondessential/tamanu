import { z } from 'zod';
import { ReferenceDataSchema } from './ReferenceDataSchema';

export const PatientSchema = z.object({
  id: z.string(),
  displayId: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  sex: z.enum(['male', 'female', 'other']),
  villageId: z.string().nullable(),
  village: ReferenceDataSchema.nullable(),
});

export type Patient = z.infer<typeof PatientSchema>;
