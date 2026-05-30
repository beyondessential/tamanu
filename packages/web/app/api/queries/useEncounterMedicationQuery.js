import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../index';

export const useEncounterMedicationQuery = (encounterId, fetchOptions) => {
  const { facilityId } = useAuth();
  const api = useApi();

  const options = {
    facilityId,
    ...fetchOptions,
  };

  return useQuery({
    queryKey: ['encounterMedication', encounterId, options],
    queryFn: async () =>
      await api.get(`encounter/${encodeURIComponent(encounterId)}/medications`, options),
    enabled: !!encounterId,
  });
};
