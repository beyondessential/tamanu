import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { useApi } from '../useApi';

export const useMoveLocationBookingMutation = (useMutationOptions = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    ({ id, startTime }) =>
      api.put(`appointments/locationBooking/${id}/move`, { startTime }, { throwResponse: true }),
    {
      ...useMutationOptions,
      onSuccess: (data, variables, context) => {
        void queryClient.invalidateQueries(['appointments']);
        useMutationOptions.onSuccess?.(data, variables, context);
      },
      onError: async (response, variables, context) => {
        const error = await response.json();
        toast.error(error.error?.message || 'Unable to move booking');
        useMutationOptions.onError?.(error, variables, context);
      },
    },
  );
};
