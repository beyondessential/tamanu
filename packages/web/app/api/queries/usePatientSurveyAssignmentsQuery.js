import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { isErrorUnknownAllow404s } from '../TamanuApi';

export const usePatientSurveyAssignmentsQuery = ({ patientId }, options) => {
  const api = useApi();

  return useQuery(
    [`patient/${patientId}/portal/forms`],
    () => api.get(`patient/${patientId}/portal/forms`, { isErrorUnknown: isErrorUnknownAllow404s }),
    {
      ...options,
    },
  );
};
