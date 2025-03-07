import { useQuery } from '@tanstack/react-query';
import { useApi } from '../index';

export const useEncounterMedicationQuery = (encounterId, fetchOptions) => {
  const api = useApi();

  return useQuery(
    ['encounterMedication', encounterId, fetchOptions],
    () => api.get(`encounter/${encodeURIComponent(encounterId)}/medications`, fetchOptions),
    { enabled: !!encounterId },
  );
};
