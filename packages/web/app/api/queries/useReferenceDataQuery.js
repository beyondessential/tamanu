import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useReferenceDataQuery = referenceDataId => {
  const api = useApi();
  return useQuery(
    ['referenceData', referenceDataId],
    () => api.get(route('referenceData/:referenceDataId', { referenceDataId })),
    { enabled: !!referenceDataId },
  );
};
