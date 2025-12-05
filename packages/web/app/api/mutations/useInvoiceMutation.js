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
      await api.put(`invoices/${invoice?.id}/cancel`);
      await queryClient.invalidateQueries([`encounter/${invoice?.encounterId}/invoice`]);
    },
    onError: error => notifyError(error.message),
  });
};

export const useFinaliseInvoice = invoice => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.put(`invoices/${invoice?.id}/finalise`);
      await queryClient.invalidateQueries([`encounter/${invoice?.encounterId}/invoice`]);
      await queryClient.invalidateQueries({
        queryKey: [`patient/${invoice.encounter?.patientId}/invoices/totalOutstandingBalance`],
      });
    },
    onError: error => notifyError(error.message),
  });
};

export const useDeleteInvoice = invoice => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete(`invoices/${invoice?.id}`);
    },
    onMutate: async () => {
      await queryClient.invalidateQueries([`encounter/${invoice?.encounterId}/invoice`]);
      queryClient.removeQueries([`encounter/${invoice?.encounterId}/invoice`]);
    },
    onError: error => notifyError(error.message),
  });
};

export const useInvoiceInsurancePlansMutation = (invoiceId, encounterId) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      await api.put(`invoices/${invoiceId}/insurancePlans`, body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries([`encounter/${encounterId}/invoice`]);
    },
    onError: error => notifyError(error.message),
  });
};
