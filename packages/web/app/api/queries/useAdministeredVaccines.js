import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAdministeredVaccines = (patientId, query) => {
  const api = useApi();

  return useQuery(['administeredVaccines', patientId], () =>
    api.get(`patient/${patientId}/administeredVaccines`, query),
  );
};
