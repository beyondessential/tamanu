import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationBookingMutation = ({ editMode = false }, useMutationOptions) => {
  const api = useApi();

  return useMutation(
    payload =>
      editMode
        ? api.put(`appointments/locationBooking/${payload.id}`, payload, { throwResponse: true })
        : api.post('appointments/locationBooking', payload, { throwResponse: true }),
    useMutationOptions,
  );
};
