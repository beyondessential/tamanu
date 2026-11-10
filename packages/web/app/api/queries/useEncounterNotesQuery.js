import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useEncounterNotesQuery = (encounterId, query) => {
  const api = useApi();

  return useQuery(['encounterNotes', encounterId], () =>
    api.get(route('encounter/:encounterId/notes', { encounterId }), query),
  );
};
