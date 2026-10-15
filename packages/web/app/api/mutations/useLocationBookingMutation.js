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
        ? api.put(
            // PUT has no query channel, so the static conflict-check flag stays in
            // the path template.
            skipConflictCheck
              ? route('appointments/locationBooking/:id?skipConflictCheck=true', { id: payload.id })
              : route('appointments/locationBooking/:id', { id: payload.id }),
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
