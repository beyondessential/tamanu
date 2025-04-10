import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLabTestQuery = labTestId => {
  const api = useApi();

  return useQuery(
    ['labTest', labTestId],
    () => api.get(`labTest/${encodeURIComponent(labTestId)}`),
    { enabled: !!labTestId },
  );
};
