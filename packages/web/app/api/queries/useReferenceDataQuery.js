import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

/** @param {string} [referenceDataId] */
export const useReferenceDataQuery = referenceDataId => {
  const api = useApi();
  return useQuery({
    queryKey: ['referenceData', referenceDataId],
    queryFn: async () =>
      await api.get(route('referenceData/:referenceDataId', { referenceDataId })),
    enabled: Boolean(referenceDataId),
  });
};
