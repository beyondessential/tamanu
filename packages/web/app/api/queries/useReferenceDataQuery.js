import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useReferenceDataQuery = (referenceDataId) => {
  const api = useApi();
  return useQuery(
    ['referenceData', referenceDataId],
    () => api.get(`referenceData/${encodeURIComponent(referenceDataId)}`),
    { enabled: !!referenceDataId },
  );
};
