import { useQuery } from '@tanstack/react-query';

import { useApi } from '../useApi';

const useAppointmentsQuery = (fetchOptions, useQueryOptions = {}) => {
  const api = useApi();
  return useQuery(
    ['appointments', fetchOptions],
    () => api.get('appointments', fetchOptions),
    useQueryOptions,
  );
};

export const useOutpatientAppointmentsQuery = (fetchOptions, useQueryOptions = {}) =>
  useAppointmentsQuery({ locationGroupId: '', ...fetchOptions }, useQueryOptions);

export const useLocationBookingsQuery = (fetchOptions, useQueryOptions = {}) =>
  useAppointmentsQuery({ locationId: '', locationGroupId: '', ...fetchOptions }, useQueryOptions);
