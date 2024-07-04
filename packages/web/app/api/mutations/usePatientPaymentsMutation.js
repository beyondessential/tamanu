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
      return result;
    },
    onError: error => notifyError(error.message),
  });
};
