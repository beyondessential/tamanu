import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientPayments = invoiceId => {
  const api = useApi();

  return useQuery(['patientPayments', invoiceId], () =>
    api.get(`invoices/${invoiceId}/patientPayments`),
  );
};
