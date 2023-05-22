import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAdministeredVaccines = (patientId, query) => {
  const api = useApi();
  // TODO: MAYBE SOMETHING REACT QUERY RELATED
  return useQuery(['administeredVaccines', patientId], () =>
    api.get(`patient/${patientId}/administeredVaccines`, query),
  );
};
