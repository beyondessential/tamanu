import { z } from 'zod';

import { ReferenceDataSchema } from './referenceData.schema';
import { ScheduledVaccineSchema } from './scheduledVaccine.schema';
import { VACCINE_STATUS } from '@tamanu/constants';

// Schema for upcoming vaccination records
export const UpcomingVaccinationSchema = z.object({
  scheduledVaccine: ScheduledVaccineSchema,
  vaccine: ReferenceDataSchema,
  dueDate: z.string(),
  daysTillDue: z.number(),
  status: z.enum(VACCINE_STATUS),
});

export type UpcomingVaccination = z.infer<typeof UpcomingVaccinationSchema>;
