import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApi } from '../useApi';

const BASE_URL = 'appointments/locationBooking';

export const useLocationBookingMutation = (
  { isEdit = false, skipConflictCheck = false },
  useMutationOptions,
) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    (payload) =>
      isEdit
        ? api.put(
            `${BASE_URL}/${payload.id}${skipConflictCheck ? '?skipConflictCheck=true' : ''}`,
            payload,
            { throwResponse: true },
          )
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
