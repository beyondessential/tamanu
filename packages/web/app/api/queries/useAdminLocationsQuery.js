import { useQuery } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useAdminLocationsQuery = (options, useQueryOptions) => {
  const api = useApi();
  return useQuery(['admin-locations', options], () => api.get('admin/locations', options), useQueryOptions);
};
