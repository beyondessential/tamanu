import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useEncounterNotesQuery = (encounterId, query) => {
  const api = useApi();

  return useQuery(['encounterNotes', encounterId], () =>
    api.get(`encounter/${encodeURIComponent(encounterId)}/notes`, query),
  );
};
