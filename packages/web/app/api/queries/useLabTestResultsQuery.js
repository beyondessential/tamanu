import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useLabTestResultsQuery = labRequestId => {
  const api = useApi();
  // The endpoint returns rows already ordered for display (panels first, then individual tests),
  // so no client-side sort params are passed.
  return useQuery(
    ['labTestResults', labRequestId],
    () => api.get(route('labRequest/:labRequestId/tests', { labRequestId })),
    { enabled: !!labRequestId },
  );
};
