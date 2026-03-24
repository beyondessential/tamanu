import { useQuery } from '@tanstack/react-query';

import { ERROR_TYPE } from '@tamanu/errors';
import { useApi } from '../../../api';
import { ROLE_ENDPOINT } from '../constants';

export const useCanDeleteRoleQuery = (roleId, useQueryOptions) => {
  const api = useApi();

  return useQuery({
    ...useQueryOptions,
    queryKey: ['role', 'isDeletable', roleId],
    queryFn: async () =>
      await api.get(`${ROLE_ENDPOINT}/${encodeURIComponent(roleId)}/isDeletable`),
    enabled: Boolean(roleId),
    retry: (failureCount, error) => {
      if (error?.status === 404) return false;
      if (error?.type === ERROR_TYPE.VALIDATION_CONSTRAINT) return false;
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
  });
};
