import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationBookingMutation = (
  { isEdit = false, skipConflictCheck = false },
  useMutationOptions,
) => {
  const api = useApi();

  const BASE_URL = 'appointments/locationBooking';

  return useMutation(
    payload =>
      isEdit
        ? api.put(
            `${BASE_URL}/${payload.id}${skipConflictCheck && '?skipConflictCheck=true'}`,
            payload,
            {
              throwResponse: true,
            },
          )
        : api.post(BASE_URL, payload, { throwResponse: true }),
    useMutationOptions,
  );
};
