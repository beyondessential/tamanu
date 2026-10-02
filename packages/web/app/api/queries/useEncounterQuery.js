import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const ENCOUNTER_QUERY_KEY = 'encounter';

/*
  A user can reach the encounter view without permission to see its related records, so a
  rejection from one of those endpoints leaves the rest of the encounter usable.
*/
const getRecordsOrEmpty = async getRecords => {
  try {
    const { data } = await getRecords();
    return data;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return [];
  }
};

/**
 * The encounter for the current route, with the related records the encounter view reads off it.
 */
export const useEncounterQuery = encounterId => {
  const api = useApi();

  return useQuery(
    [ENCOUNTER_QUERY_KEY, encounterId],
    async () => {
      const encounterPath = `encounter/${encodeURIComponent(encounterId)}`;
      const [encounter, diagnoses, procedures, medications, triages] = await Promise.all([
        api.get(encounterPath),
        getRecordsOrEmpty(() => api.get(`${encounterPath}/diagnoses`)),
        getRecordsOrEmpty(() => api.get(`${encounterPath}/procedures`)),
        getRecordsOrEmpty(() => api.get(`${encounterPath}/medications`)),
        getRecordsOrEmpty(() => api.get(`${encounterPath}/triages`)),
      ]);
      return { ...encounter, diagnoses, procedures, medications, triages };
    },
    { enabled: Boolean(encounterId) },
  );
};

/**
 * Refetches an encounter after a write that changes one of its related records.
 *
 * Exact, because `useGraphDataQuery` keys its vitals and chart graphs under this same prefix and
 * a partial match would refetch every one of them on each save.
 */
export const useInvalidateEncounter = () => {
  const queryClient = useQueryClient();
  return useCallback(
    encounterId =>
      queryClient.invalidateQueries([ENCOUNTER_QUERY_KEY, encounterId], { exact: true }),
    [queryClient],
  );
};
