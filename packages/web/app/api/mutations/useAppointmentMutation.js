import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApi } from '../useApi';

export const useAppointmentMutation = ({ appointmentId, isEdit = false }, useMutationOptions) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation(
    payload =>
      isEdit
        ? api.put(`appointments/${appointmentId}`, payload, { throwResponse: true })
        : api.post('appointments', payload, { throwResponse: true }),
    {
      ...useMutationOptions,
      onSuccess: (data, variables, context) => {
        void queryClient.invalidateQueries(['appointments']);
        if (data.encounterId) {
          void queryClient.invalidateQueries(['patientCurrentEncounter', data.patientId]);
        }
        useMutationOptions.onSuccess?.(data, variables, context);
      },
    },
  );
};
