import { z } from 'zod';
import { foreignKey } from '../../types';
import { datetimeCustomValidation } from '@tamanu/utils/dateTime';

export const CreateSurveyResponseRequestSchema = z.object({
  surveyId: foreignKey,
  startTime: datetimeCustomValidation,
  patientId: foreignKey,
  endTime: datetimeCustomValidation,
  answers: z.record(z.string(), z.unknown()),
  facilityId: foreignKey.optional(), 
});

export type CreateSurveyResponseRequest = z.infer<
  typeof CreateSurveyResponseRequestSchema
>;

// Portal-specific: patientId comes from authenticated session; times may be omitted
export const PortalCreateSurveyResponseRequestSchema = CreateSurveyResponseRequestSchema.omit({
  patientId: true,
}).partial({ startTime: true, endTime: true });

export type PortalCreateSurveyResponseRequest = z.infer<
  typeof PortalCreateSurveyResponseRequestSchema
>;
