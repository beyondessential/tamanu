import { useQuery } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';
import { useApi } from '../useApi';

export interface ReferenceDataOption {
  id: string;
  name: string;
}

/** Every current record of a reference data type, for choosing from a list. */
export const useReferenceDataOptionsQuery = (type: string, { enabled = true } = {}) => {
  const api = useApi();
  return useQuery<unknown, Error, ReferenceDataOption[]>({
    queryKey: ['referenceDataOptions', type],
    queryFn: () => api.get(route('suggestions/:type/all', { type })),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};
