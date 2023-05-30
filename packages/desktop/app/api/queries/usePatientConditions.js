import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientConditions = (patientId, query) => {
  const api = useApi();

  return useQuery(['conditions', patientId], () =>
    api.get(`patient/${patientId}/conditions`, query),
  );
};
