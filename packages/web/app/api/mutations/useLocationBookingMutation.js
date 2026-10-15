import { useMutation, useQueryClient } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';

import { useApi } from '../useApi';

const BASE_URL = 'appointments/locationBooking';

export const useLocationBookingMutation = (
  { isEdit = false, skipConflictCheck = false },
  useMutationOptions,
) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    payload =>
      isEdit
        ? api.put(route(`${BASE_URL}/:id`, { id: payload.id }), payload, {
            query: skipConflictCheck ? { skipConflictCheck: true } : {},
            throwResponse: true,
          })
        : api.post(BASE_URL, payload, { throwResponse: true }),
    {
      ...useMutationOptions,
      onSuccess: (data, variables, context) => {
        void queryClient.invalidateQueries(['appointments']);
        useMutationOptions.onSuccess?.(data, variables, context);
      },
    },
  );
};
