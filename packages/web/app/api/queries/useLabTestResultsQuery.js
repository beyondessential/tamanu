import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLabTestResultsQuery = (labRequestId) => {
  const api = useApi();
  // The endpoint returns rows already ordered for display (panels first, then individual tests),
  // so no client-side sort params are passed.
  return useQuery(
    ['labTestResults', labRequestId],
    () => api.get(`labRequest/${labRequestId}/tests`),
    { enabled: !!labRequestId },
  );
};
