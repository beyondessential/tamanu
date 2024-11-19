import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useAppointmentMutation = ({ isEdit = false }, useMutationOptions) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    payload =>
      isEdit
        ? api.put(`appointments/${payload.id}`, payload, { throwResponse: true })
        : api.post('appointments', payload, { throwResponse: true }),
    {
      ...useMutationOptions,
      onSuccess: (data, variables, context) => {
        queryClient.invalidateQueries(['appointments']);
        useMutationOptions.onSuccess?.(data, variables, context);
      },
    },
  );
};
