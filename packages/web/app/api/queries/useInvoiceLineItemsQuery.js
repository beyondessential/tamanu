import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useInvoiceLineItemsQuery = invoiceId => {
  const api = useApi();

  return useQuery(['invoiceLineItemsQuery', invoiceId], () =>
    api.get(`invoices/${encodeURIComponent(invoiceId)}/lineItems`),
  );
};
