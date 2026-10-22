import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useEncounterDataQuery = encounterId => {
  const api = useApi();

  return useQuery(['patientEncounter', encounterId], () =>
    api.get(route('encounter/:encounterId', { encounterId })),
  );
};
