import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';

export const ENCOUNTER_SYNDROMIC_SURVEILLANCE_QUERY_KEY = 'encounterSyndromicSurveillance';

/**
 * Whether syndromic surveillance is available, and the encounter's response to the syndromic
 * surveillance form, which is null until syndromic surveillance has been completed.
 */
export const useEncounterSyndromicSurveillanceQuery = (encounterId, { enabled = true } = {}) => {
  const api = useApi();

  return useQuery(
    [ENCOUNTER_SYNDROMIC_SURVEILLANCE_QUERY_KEY, encounterId],
    () => api.get(`encounter/${encodeURIComponent(encounterId)}/syndromicSurveillance`),
    { enabled: Boolean(encounterId) && enabled },
  );
};
