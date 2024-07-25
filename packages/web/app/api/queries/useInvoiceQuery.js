import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { isErrorUnknownAllow404s } from '../TamanuApi';

export const useEncounterInvoice = encounterId => {
  const api = useApi();

  return useQuery(
    [`encounter/${encounterId}/invoice`],
    () =>
      api.get(`encounter/${encounterId}/invoice`, {}, { isErrorUnknown: isErrorUnknownAllow404s }),
    {
      enabled: !!encounterId,
    },
  );
};
