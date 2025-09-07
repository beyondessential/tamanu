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
