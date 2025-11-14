import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { isErrorUnknownAllow404s } from '../TamanuApi';

export const useEncounterInvoiceQuery = (encounterId) => {
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

export const useInvoiceTotalOutstandingBalanceQuery = (patientId) => {
  const api = useApi();

  return useQuery(
    [`patient/${patientId}/invoices/totalOutstandingBalance`],
    () =>
      api.get(
        `patient/${patientId}/invoices/totalOutstandingBalance`,
        {},
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    {
      enabled: !!patientId,
    },
  );
};
