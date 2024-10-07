import { useQuery } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useAppointmentsQuery = options => {
  const api = useApi();
  return useQuery(['appointments'], () => api.get('appointments', options));
};

/** Queries appointments with a non-null location ID */
export const useLocationBookingsQuery = options => {
  const api = useApi();
  return useQuery(['appointments'], () =>
    api.get('appointments', {
      ...options,
      locationId: '',
    }),
  );
};
