import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useAppointmentMutation = (existingAppointmentId = null, useMutationOptions) => {
  const { facilityId } = useAuth();
  const api = useApi();
  const queryClient = useQueryClient();
  const isEdit = !!existingAppointmentId;

  return useMutation(
    (payload) =>
      isEdit
        ? api.put(
            `appointments/${existingAppointmentId}`,
            { ...payload, facilityId },
            { throwResponse: true },
          )
        : api.post('appointments', { ...payload, facilityId }, { throwResponse: true }),
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
