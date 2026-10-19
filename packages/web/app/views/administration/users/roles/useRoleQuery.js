import { useQuery } from '@tanstack/react-query';

import { useApi } from '../../../../api';
import { ROLE_ENDPOINT } from '../../constants';
import { route } from '@tamanu/api-client';

export const useRoleQuery = (roleId, useQueryOptions) => {
  const api = useApi();

  return useQuery({
    ...useQueryOptions,
    queryKey: ['role', roleId],
    queryFn: async () => await api.get(route(`${ROLE_ENDPOINT}/:roleId`, { roleId })),
    enabled: Boolean(roleId),
    retry: (failureCount, error) => (error?.status === 404 ? false : failureCount < 3),
  });
};
