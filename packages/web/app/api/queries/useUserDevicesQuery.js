import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useUserDevicesQuery = (userId, useQueryOptions = {}) => {
  const api = useApi();

  return useQuery(
    ['userDevices', userId],
    () => api.get(`admin/users/${userId}/devices`),
    {
      enabled: !!userId,
      ...useQueryOptions,
    },
  );
};
