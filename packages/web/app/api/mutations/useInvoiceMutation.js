import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { notifyError } from '../../utils';

export const useCreateInvoice = () => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      const result = await api.post('invoices', body);
      await queryClient.invalidateQueries([`encounter/${body?.encounterId}/invoice`]);
      return result;
    },
    onError: error => notifyError(error.message),
  });
};

export const useUpdateInvoice = ({ encounterId, invoiceId }) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      await api.put(`invoices/${invoiceId}`, body);
      await queryClient.invalidateQueries([`encounter/${encounterId}/invoice`]);
    },
    onError: error => notifyError(error.message),
  });
};

export const useCancelInvoice = ({ encounterId, invoiceId }) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post(`invoices/${invoiceId}/cancel`);
      await queryClient.invalidateQueries([`encounter/${encounterId}/invoice`]);
    },
    onError: error => notifyError(error.message),
  });
};
