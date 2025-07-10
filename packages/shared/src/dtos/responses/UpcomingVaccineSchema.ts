import { z } from 'zod';
import { dateCustomValidation } from '@tamanu/utils/dateTime';
import { VACCINE_CATEGORIES, VACCINE_STATUS } from '@tamanu/constants';

export const UpcomingVaccineSchema = z.object({
  scheduledVaccineId: z.string(),
  category: z.enum(Object.values(VACCINE_CATEGORIES) as [string, ...string[]]),
  label: z.string(),
  scheduleName: z.string(),
  dueDate: dateCustomValidation,
  status: z.enum(Object.values(VACCINE_STATUS) as [string, ...string[]]),
});

export const UpcomingVaccinesArraySchema = z.array(UpcomingVaccineSchema);
export type UpcomingVaccine = z.infer<typeof UpcomingVaccineSchema>;
