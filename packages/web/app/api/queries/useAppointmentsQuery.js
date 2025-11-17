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

export const useOutpatientAppointmentsQuery = (
  { locationGroupId = '', ...fetchOptions },
  useQueryOptions = {},
) =>
  useAppointmentsQuery(
    {
      // Providing [] here omits the `?locationGroupId=` param, but the `GET /appointments` relies
      // on its presence/absence to determine whether we are querying for location bookings or
      // outpatient appointments
      locationGroupId:
        Array.isArray(locationGroupId) && locationGroupId.length === 0 ? '' : locationGroupId,
      ...fetchOptions,
    },
    useQueryOptions,
  );

export const useLocationBookingsQuery = (fetchOptions, useQueryOptions = {}) =>
  useAppointmentsQuery({ locationId: '', ...fetchOptions }, useQueryOptions);


const useHasPastAppointmentsQuery = (patientId, fetchOptions = {}, useQueryOptions = {}) => {
  const api = useApi();
  return useQuery(
    ['hasPastAppointments', patientId],
    () => api.get(`appointments/hasPastAppointments/${patientId}`, fetchOptions),
    useQueryOptions,
  );
}

export const useHasPastOutpatientAppointmentsQuery = (patientId, useQueryOptions = {}) => {
  const { facilityId } = useAuth();
  return useHasPastAppointmentsQuery(patientId, { facilityId, type: 'outpatient' }, useQueryOptions);
}

export const useHasPastLocationBookingsQuery = (patientId, useQueryOptions = {}) => {
  const { facilityId } = useAuth();
  return useHasPastAppointmentsQuery(patientId, { facilityId, type: 'locationBooking' }, useQueryOptions);
}

const useUpcomingAppointmentsQuery = (patientId, fetchOptions = {}, useQueryOptions = {}) => {
  const api = useApi();
  return useQuery(
    ['upcomingAppointments', patientId, fetchOptions],
    () => api.get(`appointments/upcomingAppointments/${patientId}`, fetchOptions),
    useQueryOptions,
  );
}

export const useUpcomingOutpatientAppointmentsQuery = (patientId, fetchOptions = {}, useQueryOptions = {}) => {
  const { facilityId } = useAuth();
  return useUpcomingAppointmentsQuery(patientId, { facilityId, type: 'outpatient', ...fetchOptions }, useQueryOptions);
}

export const useUpcomingLocationBookingsQuery = (patientId, fetchOptions = {}, useQueryOptions = {}) => {
  const { facilityId } = useAuth();
  return useUpcomingAppointmentsQuery(patientId, { facilityId, type: 'locationBooking', ...fetchOptions }, useQueryOptions);
}
