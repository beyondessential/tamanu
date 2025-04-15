import { useQuery } from '@tanstack/react-query';
import { isErrorUnknownAllow404s, useApi } from '../index';

export const useEncounterMedicationsQuery = encounter => {
  const api = useApi();

  return useQuery(
    ['encounterMedications', encounter?.id],
    () =>
      api.get(
        `encounter/${encodeURIComponent(encounter?.id)}/medications`,
        {},
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    { enabled: !!encounter?.endDate && !!encounter?.id },
  );
};
