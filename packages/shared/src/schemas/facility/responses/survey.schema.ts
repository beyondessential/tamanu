import { z } from 'zod';

import { SURVEY_TYPES } from '@tamanu/constants';
import { ProgramSchema } from './program.schema';

export const BaseSurveySchema = z.object({
  id: z.string(),
  code: z.string().nullish(),
  name: z.string().nullish(),
  surveyType: z.enum(SURVEY_TYPES).nullish(),
});

export type BaseSurvey = z.infer<typeof BaseSurveySchema>;

export const SurveyWithProgramSchema = BaseSurveySchema.extend({
  program: ProgramSchema,
});
