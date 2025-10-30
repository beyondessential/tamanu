import { z } from 'zod';
import { SurveySchema } from './survey.schema';
import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { UserSchema } from './user.schema';
import { foreignKey } from '../../types';

export const PortalSurveyAssignmentSchema = z.object({
  id: z.string(),
  survey: SurveySchema,
  status: z.enum(PORTAL_SURVEY_ASSIGNMENTS_STATUSES),
  assignedBy: UserSchema,
  facilityId: foreignKey,
});

export type PortalSurveyAssignment = z.infer<typeof PortalSurveyAssignmentSchema>;
