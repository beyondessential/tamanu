import { z } from 'zod';

import { SEX_VALUES } from '@tamanu/constants';
import { ReferenceDataSchema } from './referenceData.schema';

export const PatientSchema = z.object({
  id: z.string(),
  displayId: z.string(),
  firstName: z.string(),
  middleName: z.string().nullish(),
  lastName: z.string(),
  dateOfBirth: z.string(),
  sex: z.enum(SEX_VALUES),
  village: ReferenceDataSchema.nullish(),
});

export type Patient = z.infer<typeof PatientSchema>;
