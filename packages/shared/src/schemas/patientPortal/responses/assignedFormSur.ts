import { z } from 'zod';
import { SurveySchema } from './survey.schema';

export const PortalProgramDataElementSchema = z.object({
  id: z.string(),
  code: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  indicator: z.string().optional().nullable(),
  defaultText: z.string().optional().nullable(),
  defaultOptions: z.unknown().optional().nullable(),
  visualisationConfig: z.unknown().optional().nullable(),
  type: z.string().optional().nullable(),
});

export const PortalSurveyScreenComponentSchema = z.object({
  id: z.string(),
  screenIndex: z.number().optional().nullable(),
  componentIndex: z.number().optional().nullable(),
  text: z.string().optional().nullable(),
  visibilityCriteria: z.string().optional().nullable(),
  validationCriteria: z.string().optional().nullable(),
  detail: z.string().optional().nullable(),
  config: z.string().optional().nullable(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.any(),
      }),
    )
    .optional()
    .nullable(),
  calculation: z.string().optional().nullable(),
  visibilityStatus: z.string().optional().nullable(),
  surveyId: z.string().optional().nullable(),
  dataElementId: z.string().optional().nullable(),
  dataElement: PortalProgramDataElementSchema.optional().nullable(),
});

export const DesignatedFormSchema = SurveySchema.extend({
  components: z.array(PortalSurveyScreenComponentSchema),
});

export type PortalProgramDataElement = z.infer<typeof PortalProgramDataElementSchema>;
export type PortalSurveyScreenComponent = z.infer<typeof PortalSurveyScreenComponentSchema>;
export type DesignatedForm = z.infer<typeof DesignatedFormSchema>;


