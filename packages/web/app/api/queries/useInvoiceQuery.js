import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useEncounterInvoiceQuery = (encounterId) => {
  const api = useApi();

  return useQuery(
    [`encounter/${encounterId}/invoice`],
    () => api.get(`encounter/${encounterId}/invoice`),
    {
      enabled: !!encounterId,
    },
  );
};

export const useInvoiceTotalOutstandingBalanceQuery = (patientId) => {
  const api = useApi();

  return useQuery(
    [`patient/${patientId}/invoices/totalOutstandingBalance`],
    () => api.get(`patient/${patientId}/invoices/totalOutstandingBalance`),
    {
      enabled: !!patientId,
    },
  );
};
