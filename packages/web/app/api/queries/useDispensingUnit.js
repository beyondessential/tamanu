import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

/**
 * @param {string | undefined} medicationId
 * @param {Omit<
 *   import('@tanstack/react-query').UseQueryOptions<string | undefined>, 'queryKey' | 'queryFn'
 * >} [options]
 * @returns {import('@tanstack/react-query').UseQueryResult<string | undefined>}
 */
export default function useDispensingUnit(
  medicationId,
  { enabled = true, ...useQueryOptions } = {},
) {
  const api = useApi();
  const { facilityId } = useAuth();

  return useQuery({
    queryKey: ['dispensingUnit', medicationId, facilityId],
    queryFn: async () => {
      const drug = await api.get(`suggestions/drug/${encodeURIComponent(medicationId)}`, {
        facilityId,
      });
      return drug?.referenceDrug?.dispensingUnit;
    },
    enabled: enabled && Boolean(medicationId),
    ...useQueryOptions,
  });
}
