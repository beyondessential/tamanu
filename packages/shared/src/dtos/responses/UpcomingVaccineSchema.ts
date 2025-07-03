import { z } from 'zod';
import { ScheduledVaccineSchema } from './ScheduledVaccineSchema';

export const UpcomingVaccineSchema = z.object({
  id: z.string(),
  dueDate: z.string().nullable(),
  status: z.string(),
  scheduledVaccineId: z.string(),
  scheduledVaccine: ScheduledVaccineSchema,
  patientId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const UpcomingVaccinesArraySchema = z.array(UpcomingVaccineSchema);
export type UpcomingVaccine = z.infer<typeof UpcomingVaccineSchema>;
