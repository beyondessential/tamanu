import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useEncounterNotes = (encounterId, query) => {
  const api = useApi();

  return useQuery(['encounterNotes', encounterId], () =>
    api.get(`encounter/${encodeURIComponent(encounterId)}/notes`, query),
  );
};
