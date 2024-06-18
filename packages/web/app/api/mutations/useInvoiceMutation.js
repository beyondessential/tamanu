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

export const useUpdateInvoice = invoice => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      await api.put(`invoices/${invoice?.id}`, body);
      await queryClient.invalidateQueries([`encounter/${invoice?.encounterId}/invoice`]);
    },
    onError: error => notifyError(error.message),
  });
};

export const useCancelInvoice = invoice => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.post(`invoices/${invoice?.id}/cancel`);
      await queryClient.invalidateQueries([`encounter/${invoice?.encounterId}/invoice`]);
    },
    onError: error => notifyError(error.message),
  });
};
