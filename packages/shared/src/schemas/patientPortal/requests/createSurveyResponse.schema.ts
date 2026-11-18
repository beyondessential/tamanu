import { z } from 'zod';
import { foreignKey } from '../../types';

export const CreateSurveyResponseRequestSchema = z.object({
  surveyId: foreignKey,
  answers: z.record(z.string(), z.unknown()),
  startTime: z.string().nullish(),
  endTime: z.string().nullish(),
});

export type CreateSurveyResponseRequest = z.infer<typeof CreateSurveyResponseRequestSchema>;
