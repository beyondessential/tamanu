import { z } from 'zod';

import { ReferenceDataSchema } from './referenceData.schema';

export const OngoingConditionSchema = z.object({
  id: z.string(),
  note: z.string().nullish(),
  recordedDate: z.string(),
  condition: ReferenceDataSchema,
});

export type OngoingCondition = z.infer<typeof OngoingConditionSchema>;
