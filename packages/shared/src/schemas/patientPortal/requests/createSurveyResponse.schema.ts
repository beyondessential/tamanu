import { z } from 'zod';
import { foreignKey } from '../../types';

export const CreateSurveyResponseRequestSchema = z.object({
  surveyId: foreignKey,
  patientId: foreignKey,
  answers: z.record(z.string(), z.unknown()),
  facilityId: foreignKey.optional(),
  locationId: foreignKey.optional(),
  departmentId: foreignKey.optional(),
  startTime: z.string().nullish(),
  endTime: z.string().nullish(),
});

export type CreateSurveyResponseRequest = z.infer<typeof CreateSurveyResponseRequestSchema>;
