import { useQuery } from '@tanstack/react-query';

import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

const useAppointmentsQuery = (fetchOptions, useQueryOptions = {}) => {
  const { facilityId } = useAuth();
  const api = useApi();
  const facilityFetchOptions = { facilityId, ...fetchOptions };
  return useQuery(
    ['appointments', facilityFetchOptions],
    () => api.get('appointments', facilityFetchOptions),
    useQueryOptions,
  );
};

export const useOutpatientAppointmentsQuery = (fetchOptions, useQueryOptions = {}) =>
  useAppointmentsQuery({ locationGroupId: '', ...fetchOptions }, useQueryOptions);

export const useLocationBookingsQuery = (fetchOptions, useQueryOptions = {}) =>
  useAppointmentsQuery({ locationId: '', ...fetchOptions }, useQueryOptions);
