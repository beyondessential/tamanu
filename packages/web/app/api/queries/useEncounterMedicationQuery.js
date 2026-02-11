import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';
import { useAuth } from '../../contexts/Auth';

export const useEncounterMedicationQuery = (encounterId, fetchOptions) => {
  const { facilityId } = useAuth();
  const api = useApi();

  return useQuery(
    ['encounterMedication', encounterId, fetchOptions],
    () =>
      api.get(`encounter/${encodeURIComponent(encounterId)}/medications`, {
        facilityId,
        ...fetchOptions,
      }),
    { enabled: !!encounterId },
  );
};
