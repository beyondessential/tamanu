import { useQuery } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useAppointmentsQuery = options => {
  const api = useApi();
  return useQuery(['appointments'], () => api.get('appointments', options));
};

/** Queries appointments with a non-null location ID */
export const useLocationBookingsQuery = (options, dependencies = []) => {
  const api = useApi();
  return useQuery(['appointments', ...dependencies], () =>
    api.get('appointments', {
      locationId: '',
      ...options,
    }),
  );
};
