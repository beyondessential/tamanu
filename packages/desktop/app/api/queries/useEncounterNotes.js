import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useEncounterNotes = encounterId => {
  const api = useApi();

  return useQuery(['useEncounterNotes', encounterId], () =>
    api.get(`encounter/${encodeURIComponent(encounterId)}/notePages`),
  );
};
