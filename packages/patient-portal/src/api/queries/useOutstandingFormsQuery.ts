import { useQuery } from '@tanstack/react-query';

import {
  PatientSurveyAssignmentSchema,
  type PatientSurveyAssignment,
} from '@tamanu/shared/schemas/patientPortal/responses/patientSurveyAssignment.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';
import { transformArray } from '@utils/transformData';

export const useOutstandingFormsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, PatientSurveyAssignment[]>({
    queryKey: ['outstandingForms', user?.id],
    queryFn: () => api.get('/me/forms/outstanding'),
    enabled: !!user?.id,
    select: transformArray<PatientSurveyAssignment>(PatientSurveyAssignmentSchema),
  });
};
