import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useReferenceDataChildren = (referenceDataId, fetchOptions) => {
  const api = useApi();
  return useQuery(
    ['referenceDataChildren', referenceDataId],
    () => api.get(`referenceData/${encodeURIComponent(referenceDataId)}/children`, fetchOptions),
    { enabled: !!referenceDataId },
  );
};
