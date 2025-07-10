import { z } from 'zod';
import { ReferenceDataSchema } from './ReferenceDataSchema';

export const OngoingConditionSchema = z.object({
  id: z.string(),
  note: z.string(),
  recordedDate: z.string(),
  resolved: z.boolean(),
  resolutionDate: z.string().nullable(),
  resolutionNote: z.string().nullable(),
  patientId: z.string(),
  conditionId: z.string(),
  examinerId: z.string(),
  resolutionPractitionerId: z.string().nullable(),
  condition: ReferenceDataSchema,
});

export const OngoingConditionsArraySchema = z.array(OngoingConditionSchema);

export type OngoingCondition = z.infer<typeof OngoingConditionSchema>;
