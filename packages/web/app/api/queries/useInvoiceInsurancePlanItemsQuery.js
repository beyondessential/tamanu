import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useInvoiceInsurancePlanItemsQuery = ({
  encounterId,
  productId,
  enabled,
  onSuccess,
}) => {
  const api = useApi();

  return useQuery(
    ['invoices/insurance-plan-items', { encounterId, productId }],
    () =>
      api.get('invoices/insurance-plan-items', {
        encounterId,
        productId,
      }),
    {
      enabled: Boolean(enabled && encounterId && productId),
      onSuccess,
      keepPreviousData: true,
    },
  );
};
