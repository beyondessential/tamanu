import { PORTAL_SURVEY_ASSIGNMENTS_STATUSES } from '@tamanu/constants';
import { z } from 'zod';
import { PatientSchema } from '../../patientPortal/responses/patient.schema';
import { SurveyWithProgramSchema } from './survey.schema';
import { UserSchema } from './user.schema';

export const PortalSurveyAssignmentsSchema = z.object({
  id: z.string(),
  patient: PatientSchema,
  assignedBy: UserSchema,
  assignedAt: z.string(),
  survey: SurveyWithProgramSchema,
  status: z.enum(PORTAL_SURVEY_ASSIGNMENTS_STATUSES),
});

export type PortalSurveyAssignments = z.infer<typeof PortalSurveyAssignmentsSchema>;
