import { useQuery } from '@tanstack/react-query';
import { type PatientSurveyAssignment } from '@tamanu/shared/schemas/patientPortal/responses/patientSurveyAssignment.schema';
import { PatientSurveyAssignmentSchema } from '@tamanu/shared/schemas/patientPortal/responses/patientSurveyAssignment.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): PatientSurveyAssignment[] => {
  const responseData = response as { data: unknown[] };
  if (!responseData.data) {
    return [];
  }

  return responseData.data.map(item => PatientSurveyAssignmentSchema.parse(item));
};

export const useOutstandingFormsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, PatientSurveyAssignment[]>({
    queryKey: ['outstandingForms', user?.id],
    queryFn: () => api.get('/me/forms/outstanding'),
    enabled: !!user?.id,
    select: transformData,
  });
};
