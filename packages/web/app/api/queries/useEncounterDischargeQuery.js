import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';
import { route } from '@tamanu/api-client';

export const useEncounterDischargeQuery = encounter => {
  const api = useApi();

  return useQuery(
    ['encounterDischarge', encounter?.id],
    () => api.get(route('encounter/:encounterId/discharge', { encounterId: encounter?.id })),
    { enabled: !!encounter?.endDate && !!encounter?.id },
  );
};
