import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAppointmentMutation = ({ isEdit = false }, useMutationOptions) => {
  const api = useApi();

  return useMutation(
    payload =>
      isEdit
        ? api.put(`appointments/${payload.id}`, payload, { throwResponse: true })
        : api.post('appointments', payload, { throwResponse: true }),
    useMutationOptions,
  );
};
