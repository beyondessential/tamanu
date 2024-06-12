import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { isErrorUnknownAllow404s } from '../TamanuApi';

export const useEncounterInvoiceQuery = encounterId => {
  const api = useApi();
  return useQuery(['encounterInvoice', encounterId], () =>
    api.get(`encounter/${encounterId}/invoice`,
      {},
      { isErrorUnknown: isErrorUnknownAllow404s }
    ),
  );
};
