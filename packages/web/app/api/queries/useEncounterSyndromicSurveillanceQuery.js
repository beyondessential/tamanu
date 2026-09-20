import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';

export const ENCOUNTER_SYNDROMIC_SURVEILLANCE_QUERY_KEY = 'encounterSyndromicSurveillance';

/**
 * The encounter's recorded syndromic surveillance data, or null if nothing has been recorded yet.
 */
export const useEncounterSyndromicSurveillanceQuery = (encounterId, { enabled = true } = {}) => {
  const api = useApi();

  return useQuery(
    [ENCOUNTER_SYNDROMIC_SURVEILLANCE_QUERY_KEY, encounterId],
    () => api.get(`encounter/${encodeURIComponent(encounterId)}/syndromicSurveillance`),
    { enabled: Boolean(encounterId) && enabled },
  );
};
