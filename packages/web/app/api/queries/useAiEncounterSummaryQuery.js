import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const AI_ENCOUNTER_SUMMARY_QUERY_KEY = 'aiEncounterSummary';

export const useAiEncounterSummaryQuery = encounterId => {
  const api = useApi();
  return useQuery(
    [AI_ENCOUNTER_SUMMARY_QUERY_KEY, encounterId],
    () => api.get(route('ai/encounter/summary/:encounterId', { encounterId })),
    { enabled: !!encounterId, staleTime: 0 },
  );
};
