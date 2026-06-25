import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const AI_ENCOUNTER_SUMMARY_QUERY_KEY = 'aiEncounterSummary';

export const useAiEncounterSummaryQuery = encounterId => {
  const api = useApi();
  return useQuery(
    [AI_ENCOUNTER_SUMMARY_QUERY_KEY, encounterId],
    () => api.get(`ai/encounter/summary/${encodeURIComponent(encounterId)}`),
    { enabled: !!encounterId, staleTime: 0 },
  );
};
