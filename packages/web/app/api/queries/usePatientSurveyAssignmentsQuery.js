import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { isErrorUnknownAllow404s } from '../TamanuApi';

export const usePatientSurveyAssignmentsQuery = (
  { patientId, order = 'ASC', orderBy = 'assignedAt', status, surveyId, ...filterParams },
  options,
) => {
  const api = useApi();

  // Build query parameters (excluding pagination)
  const queryParams = {
    order,
    orderBy,
    ...(status && { status }),
    ...(surveyId && { surveyId }),
    ...filterParams,
  };

  return useQuery(
    [`patient/${patientId}/portal/forms`, queryParams],
    () =>
      api.get(`patient/${patientId}/portal/forms`, {
        params: queryParams,
        isErrorUnknown: isErrorUnknownAllow404s,
      }),
    {
      ...options,
    },
  );
};
