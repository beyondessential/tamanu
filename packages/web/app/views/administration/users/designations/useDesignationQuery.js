import { useQuery } from '@tanstack/react-query';

import { useApi } from '../../../../api';
import { DESIGNATION_ENDPOINT } from '../../constants';
import { route } from '@tamanu/api-client';

export const useDesignationQuery = (designationId, useQueryOptions) => {
  const api = useApi();

  return useQuery({
    ...useQueryOptions,
    queryKey: ['designation', designationId],
    queryFn: async () =>
      await api.get(
        route(':DESIGNATION_ENDPOINT/:designationId', { DESIGNATION_ENDPOINT, designationId }),
      ),
    enabled: Boolean(designationId),
    retry: (failureCount, error) => (error?.status === 404 ? false : failureCount < 3),
  });
};
