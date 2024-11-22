import { useQuery } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useAppointmentsQuery = (fetchOptions, useQueryOptions = {}) => {
  const api = useApi();
  return useQuery(
    ['appointments', fetchOptions],
    () => api.get('appointments', fetchOptions),
    useQueryOptions,
  );
};
