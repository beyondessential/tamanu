import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLocationBookingMutation = ({ isEdit = false }, useMutationOptions) => {
  const api = useApi();

  return useMutation(
    payload =>
      isEdit
        ? api.put(`appointments/locationBooking/${payload.id}`, payload, { throwResponse: true })
        : api.post('appointments/locationBooking', payload, { throwResponse: true }),
    useMutationOptions,
  );
};
