import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useInvoicePriceListItemPriceQuery = ({
  encounterId,
  productId,
  enabled,
  onSuccess,
}) => {
  const api = useApi();

  return useQuery(
    ['invoices/price-list-item', encounterId, productId],
    () =>
      api.get(
        'invoices/price-list-item',
        {
          encounterId,
          productId,
        },
        // Don't show error toasts when a price list isn't found as it's a valid configurable state
        { showUnknownErrorToast: false },
      ),
    {
      enabled,
      onSuccess,
      keepPreviousData: true,
    },
  );
};
