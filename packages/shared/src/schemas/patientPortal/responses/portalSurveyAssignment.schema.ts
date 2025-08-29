import { z } from 'zod';
import { SurveySchema } from './survey.schema';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { UserSchema } from './user.schema';

export const PortalSurveyAssignmentSchema = z.object({
  id: z.string(),
  survey: SurveySchema,
  status: z.enum(PORTAL_SURVEY_ASSIGNMENTS_STATUSES),
  assignedBy: UserSchema,
});

export type PortalSurveyAssignment = z.infer<typeof PortalSurveyAssignmentSchema>;