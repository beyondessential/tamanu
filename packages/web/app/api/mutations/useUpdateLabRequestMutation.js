import { useMutation, useQueryClient } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';
import { LAB_REQUEST_STATUSES } from '@tamanu/constants';
import { useDateTime } from '@tamanu/ui-components';
import { useApi } from '../useApi';

export const useUpdateLabRequestMutation = labRequestId => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { getCurrentDateTime } = useDateTime();

  return useMutation({
    mutationFn: async data => {
      const update = { ...data };
      if (data.status) update.userId = api.user.id;
      if (data.status === LAB_REQUEST_STATUSES.PUBLISHED) {
        update.publishedDate = getCurrentDateTime();
      }
      return await api.put(route('labRequest/:labRequestId', { labRequestId }), update);
    },
    onSuccess: async () => await queryClient.invalidateQueries(['labRequest', labRequestId]),
  });
};
