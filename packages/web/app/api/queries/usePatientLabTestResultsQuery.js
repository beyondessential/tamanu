import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const usePatientLabTestResultsQuery = (patientId, fetchOptions) => {
  const api = useApi();

  return useQuery(['patient', patientId, 'labTestResults', fetchOptions], () =>
    api.get(route('patient/:patientId/labTestResults', { patientId }), fetchOptions),
  );
};
