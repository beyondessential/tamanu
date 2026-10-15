import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';
import { route } from '@tamanu/api-client';

export const useSendPatientPortalForm = (patientId, { onSuccess, onError } = {}) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation(
    ({ formId, assignedAt, email }) =>
      api.post(route('patient/:patientId/portal/forms', { patientId }), {
        formId,
        assignedAt,
        email,
        facilityId,
      }),
    {
      onSuccess: args => {
        queryClient.invalidateQueries(['patient', patientId]);
        onSuccess?.(args);
      },
      onError: args => {
        onError?.(args);
      },
    },
  );
};
