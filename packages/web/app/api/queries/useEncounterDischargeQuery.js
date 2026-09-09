import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';

export const useEncounterDischargeQuery = (encounter) => {
  const api = useApi();

  return useQuery(
    ['encounterDischarge', encounter?.id],
    () => api.get(`encounter/${encodeURIComponent(encounter?.id)}/discharge`),
    { enabled: !!encounter?.endDate && !!encounter?.id },
  );
};
