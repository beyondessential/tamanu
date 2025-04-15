import { useQuery } from '@tanstack/react-query';
import { isErrorUnknownAllow404s, useApi } from '../index';

export const useEncounterMedicationsQuery = encounterId => {
  const api = useApi();

  return useQuery(
    ['encounterMedications', encounterId],
    () =>
      api.get(
        `encounter/${encounterId}/medications`,
        {},
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    { enabled: !!encounterId },
  );
};
