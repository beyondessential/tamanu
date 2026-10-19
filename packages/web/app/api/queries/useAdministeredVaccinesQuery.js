import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useAdministeredVaccinesQuery = (patientId, query) => {
  const api = useApi();

  return useQuery(['administeredVaccines', patientId], () =>
    api.get(route('patient/:patientId/administeredVaccines', { patientId }), query),
  );
};
