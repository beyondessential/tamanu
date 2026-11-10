import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useEncounterInvoiceQuery = encounterId => {
  const api = useApi();

  return useQuery(
    [`encounter/${encounterId}/invoice`],
    () => api.get(route('encounter/:encounterId/invoice', { encounterId })),
    {
      enabled: !!encounterId,
    },
  );
};

export const useInvoiceTotalOutstandingBalanceQuery = patientId => {
  const api = useApi();

  return useQuery(
    [`patient/${patientId}/invoices/totalOutstandingBalance`],
    () => api.get(route('patient/:patientId/invoices/totalOutstandingBalance', { patientId })),
    {
      enabled: !!patientId,
    },
  );
};
