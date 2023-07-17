import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLabTestResultsQuery = labRequestId => {
  const api = useApi();
  return useQuery(
    ['labTestResults', labRequestId],
    () => api.get(`labRequest/${labRequestId}/tests`),
    { enabled: !!labRequestId },
  );
};
