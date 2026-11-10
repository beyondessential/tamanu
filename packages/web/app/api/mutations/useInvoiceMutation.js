import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { notifyError } from '../../utils';
import { route } from '@tamanu/api-client';

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
      await api.put(route('invoices/:invoiceId', { invoiceId: invoice?.id }), body);
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
      await api.put(route('invoices/:invoiceId/cancel', { invoiceId: invoice?.id }));
      await queryClient.invalidateQueries([`encounter/${invoice?.encounterId}/invoice`]);
      await queryClient.invalidateQueries(['insurancePlansInUse', invoice?.encounter?.patientId]);
    },
    onError: error => notifyError(error.message),
  });
};

export const useFinaliseInvoice = invoice => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.put(route('invoices/:invoiceId/finalise', { invoiceId: invoice?.id }));
      await queryClient.invalidateQueries([`encounter/${invoice?.encounterId}/invoice`]);
      await queryClient.invalidateQueries({
        queryKey: [`patient/${invoice.encounter?.patientId}/invoices/totalOutstandingBalance`],
      });
      await queryClient.invalidateQueries(['insurancePlansInUse', invoice?.encounter?.patientId]);
    },
    onError: error => notifyError(error.message),
  });
};

export const useDeleteInvoice = invoice => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.delete(route('invoices/:invoiceId', { invoiceId: invoice?.id }));
    },
    onMutate: async () => {
      await queryClient.invalidateQueries([`encounter/${invoice?.encounterId}/invoice`]);
      queryClient.removeQueries([`encounter/${invoice?.encounterId}/invoice`]);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries(['insurancePlansInUse', invoice?.encounter?.patientId]);
    },
    onError: error => notifyError(error.message),
  });
};

export const useInvoiceInsurancePlansMutation = (invoiceId, encounterId, patientId) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async body => {
      await api.put(route('invoices/:invoiceId/insurancePlans', { invoiceId }), body);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries([`encounter/${encounterId}/invoice`]);
      await queryClient.invalidateQueries(['insurancePlansInUse', patientId]);
    },
    onError: error => notifyError(error.message),
  });
};

export const useUpdateInvoiceItemApproval = invoice => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, approved }) => {
      await api.put(
        route('invoices/:invoiceId/items/:itemId/approval', { invoiceId: invoice?.id, itemId }),
        { approved },
      );
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries([`encounter/${invoice?.encounterId}/invoice`]);
    },
    onError: error => notifyError(error.message),
  });
};

export const useBulkUpdateInvoiceItemApproval = invoice => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ approved }) => {
      await api.put(route('invoices/:invoiceId/items/approval', { invoiceId: invoice?.id }), {
        approved,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries([`encounter/${invoice?.encounterId}/invoice`]);
    },
    onError: error => notifyError(error.message),
  });
};
