import { useQuery } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useAppointmentsQuery = (fetchOptions, queryOptions = {}) => {
  const api = useApi();
  return useQuery(
    ['appointments', fetchOptions],
    () => api.get('appointments', fetchOptions),
    queryOptions,
  );
};
