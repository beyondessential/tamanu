import { useMutation } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useAppointmentMutation = ({ isEdit = false }, useMutationOptions) => {
  const { facilityId } = useAuth();
  const api = useApi();

  return useMutation(
    payload =>
      isEdit
        ? api.put(`appointments/${payload.id}`, { ...payload, facilityId }, { throwResponse: true })
        : api.post('appointments', { ...payload, facilityId }, { throwResponse: true }),
    useMutationOptions,
  );
};
