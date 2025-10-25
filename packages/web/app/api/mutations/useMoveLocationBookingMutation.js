import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useMoveLocationBookingMutation = (useMutationOptions = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { facilityId } = useAuth();

  return useMutation(
    ({ id, startTime }) =>
      api.put(
        `appointments/locationBooking/${id}/move`,
        { facilityId, startTime },
        { throwResponse: true },
      ),
    {
      ...useMutationOptions,
      onSuccess: (data, variables, context) => {
        void queryClient.invalidateQueries(['appointments']);
        useMutationOptions.onSuccess?.(data, variables, context);
      },
      onError: (error, variables, context) => {
        toast.error('Unable to move booking');
        useMutationOptions.onError?.(error, variables, context);
      },
    },
  );
};


