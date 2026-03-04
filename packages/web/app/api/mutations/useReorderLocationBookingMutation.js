import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { useApi } from '../useApi';

export const useReorderLocationBookingMutation = (useMutationOptions = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    ({ appointments }) =>
      api.put(`appointments/reorder-location-bookings`, { appointments }, { throwResponse: true }),
    {
      ...useMutationOptions,
      onSuccess: (data, variables, context) => {
        void queryClient.invalidateQueries(['appointments']);
        useMutationOptions.onSuccess?.(data, variables, context);
      },
      onError: async (response, variables, context) => {
        const error = await response.json();
        toast.error(error.error?.message || 'Unable to reorder bookings');
        useMutationOptions.onError?.(error, variables, context);
      },
    },
  );
};
