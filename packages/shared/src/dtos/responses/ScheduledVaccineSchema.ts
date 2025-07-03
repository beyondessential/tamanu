import { z } from 'zod';

export const ScheduledVaccineSchema = z.object({
  id: z.string(),
  label: z.string(),
  doseLabel: z.string().nullable(),
  category: z.string().nullable(),
  schedule: z.string().nullable(),
});

export type ScheduledVaccine = z.infer<typeof ScheduledVaccineSchema>;
