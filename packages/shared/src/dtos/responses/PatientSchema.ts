import { z } from 'zod';
import { dateCustomValidation, datetimeCustomValidation } from '@tamanu/utils/dateTime';

import { ReferenceDataSchema } from './ReferenceDataSchema';
import { SexSchema } from '../commonSchemas';

export const PatientSchema = z.object({
  id: z.string(),
  displayId: z.string(),
  firstName: z.string().nullable(),
  middleName: z.string().nullable(),
  culturalName: z.string().nullable(),
  lastName: z.string().nullable(),
  dateOfBirth: dateCustomValidation.nullable(),
  dateOfDeath: datetimeCustomValidation.nullable(),
  sex: SexSchema,
  email: z.string().nullable(),
  visibilityStatus: z.string().nullable(),
  mergedIntoId: z.string().nullable(),
  villageId: z.string().nullable(),
  village: ReferenceDataSchema.nullable(),
});

export type Patient = z.infer<typeof PatientSchema>;
