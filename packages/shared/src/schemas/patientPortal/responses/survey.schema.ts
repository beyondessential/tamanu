import { z } from 'zod';

import { SURVEY_TYPES } from '@tamanu/constants';

export const ProgramDataElementSchema = z.object({
  id: z.string(),
  code: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  indicator: z.string().optional().nullable(),
  defaultText: z.string().optional().nullable(),
  defaultOptions: z.unknown().optional().nullable(),
  visualisationConfig: z.unknown().optional().nullable(),
  type: z.string().optional().nullable(),
});

export const SurveyScreenComponentSchema = z.object({
  id: z.string(),
  screenIndex: z.number().optional().nullable(),
  componentIndex: z.number().optional().nullable(),
  text: z.string().optional().nullable(),
  visibilityCriteria: z.string().optional().nullable(),
  validationCriteria: z.string().optional().nullable(),
  detail: z.string().optional().nullable(),
  config: z.string().optional().nullable(),
  options: z.string().optional().nullable(),
  calculation: z.string().optional().nullable(),
  visibilityStatus: z.string().optional().nullable(),
  dataElement: ProgramDataElementSchema.optional().nullable(),
  dataElementId: z.string().optional().nullable(),
});

export const SurveySchema = z.object({
  id: z.string(),
  name: z.string(),
  code: z.string(),
  surveyType: z.enum(SURVEY_TYPES),
});

export const SurveyWithComponentsSchema = SurveySchema.extend({
  components: z.array(SurveyScreenComponentSchema).optional().nullable(),
});

export type Survey = z.infer<typeof SurveySchema>;
export type SurveyWithComponents = z.infer<typeof SurveyWithComponentsSchema>;
export type ProgramDataElement = z.infer<typeof ProgramDataElementSchema>;
export type SurveyScreenComponent = z.infer<typeof SurveyScreenComponentSchema>;
