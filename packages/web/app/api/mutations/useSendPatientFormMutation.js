import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useSendPatientPortalForm = (patientId, { onSuccess, onError } = {}) => {
  const api = useApi();
  const { facilityId } = useAuth();
  const queryClient = useQueryClient();

  return useMutation(
    ({ formId, assignedAt, email }) =>
      api.post(`patient/${patientId}/portal/forms`, {
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
