import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';
import { route } from '@tamanu/api-client';

// Gets the first alphabetically ordered chart survey that has any answer
export const useEncounterChartWithResponseQuery = encounterId => {
  const api = useApi();

  return useQuery(
    ['encounterInitialChart', encounterId],
    () => api.get(route('encounter/:encounterId/initialChart', { encounterId })),
    // `enabled` was being passed to api.get as the query argument, so this query
    // was never actually gated on having an encounter id.
    { enabled: Boolean(encounterId) },
  );
};
