import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useLabTestQuery = labTestId => {
  const api = useApi();

  return useQuery(
    ['labTest', labTestId],
    () => api.get(route('labTest/:labTestId', { labTestId })),
    { enabled: !!labTestId },
  );
};
