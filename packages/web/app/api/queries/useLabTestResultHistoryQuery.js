import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLabTestResultHistoryQuery = (labTestId) => {
  const api = useApi();

  return useQuery(
    ['labTestResultHistory', labTestId],
    () => api.get(`labTest/${encodeURIComponent(labTestId)}/history`),
    { enabled: !!labTestId },
  );
};
