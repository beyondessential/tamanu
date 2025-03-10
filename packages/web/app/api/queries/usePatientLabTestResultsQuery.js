import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientLabTestResultsQuery = (patientId, fetchOptions) => {
  const api = useApi();

  return useQuery(['patient', patientId, 'labTestResults', fetchOptions], () =>
    api.get(`patient/${patientId}/labTestResults`, fetchOptions),
  );
};
