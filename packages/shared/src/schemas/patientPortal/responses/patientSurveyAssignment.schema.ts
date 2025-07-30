import { z } from 'zod';
import { SurveySchema } from './survey.schema';
import { PATIENT_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { UserSchema } from './user.schema';

export const PatientSurveyAssignmentSchema = z.object({
  id: z.string(),
  survey: SurveySchema,
  status: z.enum(PATIENT_SURVEY_ASSIGNMENTS_STATUSES),
  assignedBy: UserSchema,
  completedAt: z.string().nullish(),
});

export type PatientSurveyAssignment = z.infer<typeof PatientSurveyAssignmentSchema>;
