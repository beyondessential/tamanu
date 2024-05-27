import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePriceChangeItemsQuery = invoiceId => {
  const api = useApi();
  return useQuery(['priceChangeItems', invoiceId], () =>
    api.get(`invoices/${encodeURIComponent(invoiceId)}/priceChangeItems`),
  );
};
