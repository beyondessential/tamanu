import { z } from 'zod';

import { SURVEY_TYPES } from '@tamanu/constants';

export const SurveySchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  surveyType: z.enum(SURVEY_TYPES),
});

export type Survey = z.infer<typeof SurveySchema>;
