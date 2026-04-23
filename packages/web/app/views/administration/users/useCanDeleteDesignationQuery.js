import { useQuery } from '@tanstack/react-query';

import { ERROR_TYPE } from '@tamanu/errors';
import { useApi } from '../../../api';
import { DESIGNATION_ENDPOINT } from '../constants';

export const useCanDeleteDesignationQuery = (designationId, useQueryOptions) => {
  const api = useApi();

  return useQuery({
    ...useQueryOptions,
    queryKey: ['designation', 'isDeletable', designationId],
    queryFn: async () =>
      await api.get(
        `${DESIGNATION_ENDPOINT}/${encodeURIComponent(designationId)}/isDeletable`,
        null,
        { showUnknownErrorToast: false },
      ),
    enabled: Boolean(designationId),
    retry: (failureCount, error) => {
      if (error?.status === 404) return false;
      if (error?.type === ERROR_TYPE.VALIDATION_CONSTRAINT) return false;
      return failureCount < 3;
    },
    refetchOnWindowFocus: false,
  });
};
