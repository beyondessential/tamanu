import { z } from 'zod';

import { ReferenceDataSchema } from './referenceData.schema';
import { VACCINE_CATEGORIES_VALUES } from '@tamanu/constants';

// Main schema for scheduled vaccines returned to patient portal
export const ScheduledVaccineSchema = z.object({
  id: z.string(),
  category: z.enum(VACCINE_CATEGORIES_VALUES),
  label: z.string(),
  doseLabel: z.string(),
  weeksFromBirthDue: z.number().nullable(),
  vaccine: ReferenceDataSchema,
  visibilityStatus: z.string(),
});

export type ScheduledVaccine = z.infer<typeof ScheduledVaccineSchema>;
