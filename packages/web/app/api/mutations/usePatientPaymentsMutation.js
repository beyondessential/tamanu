import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { notifyError } from '../../utils';

export const useCreatePatientPayment = invoiceId => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      const result = await api.post(`invoices/${invoiceId}/patientPayments`, body);
      await queryClient.invalidateQueries(['invoicePatientPayments', invoiceId]);
      return result;
    },
    onError: error => notifyError(error.message),
  });
};

export const useUpdatePatientPayment = (invoiceId, paymentId) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      const result = await api.put(`invoices/${invoiceId}/patientPayments/${paymentId}`, body);
      await queryClient.invalidateQueries(['invoicePatientPayments', invoiceId]);
      return result;
    },
    onError: error => notifyError(error.message),
  });
};
