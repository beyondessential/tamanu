import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useInvoiceInsurancePlanItemsQuery = ({
  encounterId,
  productId,
  invoiceSectionId,
  enabled,
  onSuccess,
}) => {
  const api = useApi();

  return useQuery(
    ['invoices/insurance-plan-items', encounterId, productId, invoiceSectionId],
    () =>
      api.get('invoices/insurance-plan-items', {
        encounterId,
        productId,
        invoiceSectionId,
      }),
    {
      enabled,
      onSuccess,
      keepPreviousData: true,
    },
  );
};
