import { z } from 'zod';

export const EncounterSchema = z.object({
  id: z.string(),
  patientId: z.string(),
});

export type Encounter = z.infer<typeof EncounterSchema>;
