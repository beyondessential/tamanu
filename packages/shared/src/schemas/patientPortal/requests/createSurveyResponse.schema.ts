import { z } from 'zod';
import { foreignKey } from '../../types';

export const PortalCreateSurveyResponseRequestSchema = z.object({
  surveyId: foreignKey,
  answers: z.record(z.string(), z.unknown()),
  facilityId: foreignKey.optional(),
  locationId: foreignKey.optional(),
  departmentId: foreignKey.optional(),
});

export type PortalCreateSurveyResponseRequest = z.infer<typeof PortalCreateSurveyResponseRequestSchema>;