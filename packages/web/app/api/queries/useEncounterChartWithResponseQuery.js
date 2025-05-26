import { useQuery } from '@tanstack/react-query';
import { isErrorUnknownAllow404s, useApi } from '../index';

// Gets the first alphabetically ordered chart survey that has any answer
export const useEncounterChartWithResponseQuery = (encounterId) => {
  const api = useApi();

  return useQuery(['encounterInitialChart', encounterId], () =>
    api.get(
      `encounter/${encounterId}/initialChart`,
      { isErrorUnknown: isErrorUnknownAllow404s },
      { enabled: Boolean(encounterId) },
    ),
  );
};
