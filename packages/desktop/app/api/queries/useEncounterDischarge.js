import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useEncounterDischarge = encounterId => {
  const api = useApi();

  return useQuery(['useEncounterDischarge', encounterId], () =>
    api.get(`encounter/${encodeURIComponent(encounterId)}/discharge`),
  );
};
