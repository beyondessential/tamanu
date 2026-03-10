import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { notifyError } from '../../utils';

export const useCreatePatientPayment = invoice => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      const result = await api.post(`invoices/${invoice.id}/patientPayments`, body);
      await queryClient.invalidateQueries([`encounter/${invoice.encounterId}/invoice`]);
      await queryClient.invalidateQueries({
        queryKey: [`patient/${invoice.encounter?.patientId}/invoices/totalOutstandingBalance`],
      });
      return result;
    },
    onError: error => notifyError(error.message),
  });
};

export const useUpdatePatientPayment = (invoice, paymentId) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      const result = await api.put(`invoices/${invoice.id}/patientPayments/${paymentId}`, body);
      await queryClient.invalidateQueries([`encounter/${invoice.encounterId}/invoice`]);
      await queryClient.invalidateQueries({
        queryKey: [`patient/${invoice.encounter?.patientId}/invoices/totalOutstandingBalance`],
      });
      return result;
    },
    onError: error => notifyError(error.message),
  });
};

export const useRefundPatientPayment = (invoice, paymentId) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      return await api.post(`invoices/${invoice.id}/patientPayments/${paymentId}/refund`, body);
    },
    onSuccess: () => {
      queryClient.invalidateQueries([`encounter/${invoice.encounterId}/invoice`]);
      queryClient.invalidateQueries({
        queryKey: [`patient/${invoice.encounter?.patientId}/invoices/totalOutstandingBalance`],
      });
    },
    onError: error => notifyError(error.message),
  });
};
