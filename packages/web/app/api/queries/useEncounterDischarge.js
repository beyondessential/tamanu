import { useQuery } from '@tanstack/react-query';
import { isErrorUnknownAllow404s, useApi } from '../index';

export const useEncounterDischarge = encounter => {
  const api = useApi();

  return useQuery(
    ['encounterDischarge', encounter?.id],
    () =>
      api.get(
        `encounter/${encodeURIComponent(encounter?.id)}/discharge`,
        {},
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    { enabled: !!encounter?.endDate && !!encounter?.id },
  );
};
