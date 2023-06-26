import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useEncounterData = encounterId => {
  const api = useApi();

  return useQuery(['patientEncounter', encounterId], () =>
    api.get(`encounter/${encodeURIComponent(encounterId)}`),
  );
};
