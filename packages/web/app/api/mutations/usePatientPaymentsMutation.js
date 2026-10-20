import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { notifyError } from '../../utils';
import { route } from '@tamanu/api-client';

export const useCreatePatientPayment = invoice => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      const result = await api.post(
        route('invoices/:invoiceId/patientPayments', { invoiceId: invoice.id }),
        body,
      );
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
      const result = await api.put(
        route('invoices/:invoiceId/patientPayments/:paymentId', {
          invoiceId: invoice.id,
          paymentId,
        }),
        body,
      );
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
      return await api.post(
        route('invoices/:invoiceId/patientPayments/:paymentId/refund', {
          invoiceId: invoice.id,
          paymentId,
        }),
        body,
      );
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
