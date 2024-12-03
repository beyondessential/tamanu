import { useQuery } from '@tanstack/react-query';

import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

const useAppointmentsQuery = (fetchOptions, useQueryOptions = {}) => {
  const api = useApi();
  return useQuery(
    ['appointments', fetchOptions],
    () => api.get('appointments', fetchOptions),
    useQueryOptions,
  );
};

export const useOutpatientAppointmentsQuery = (fetchOptions, useQueryOptions = {}) => {
  const { facilityId } = useAuth();
  return useAppointmentsQuery(
    { locationGroupId: '', 'locationGroup.facility_id': facilityId, ...fetchOptions },
    useQueryOptions,
  );
};

export const useLocationBookingsQuery = (fetchOptions, useQueryOptions = {}) => {
  const { facilityId } = useAuth();
  return useAppointmentsQuery(
    { locationId: '', 'location.facility_id': facilityId, ...fetchOptions },
    useQueryOptions,
  );
};
