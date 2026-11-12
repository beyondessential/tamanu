import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';
import { route } from '@tamanu/api-client';

export const ENCOUNTER_DISCHARGE_DRAFT_QUERY_KEY = 'encounterDischargeDraft';

/**
 * The requesting clinician's own part-completed discharge form for this encounter, or null.
 * The endpoint scopes to the logged-in user, so this never returns anyone else's draft.
 */
export const useEncounterDischargeDraftQuery = (encounterId, { enabled = true } = {}) => {
  const api = useApi();

  return useQuery(
    [ENCOUNTER_DISCHARGE_DRAFT_QUERY_KEY, encounterId],
    () => api.get(route('encounter/:encounterId/dischargeDraft', { encounterId })),
    { enabled: Boolean(encounterId) && enabled },
  );
};
