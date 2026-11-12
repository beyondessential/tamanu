import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  PatientWithAdditionalData,
  UpdatePatientDetailsRequest,
} from '@tamanu/shared/schemas/patientPortal';
import { useApi } from '../useApi';

/** Saves the details the patient changed, and shows the saved record everywhere. */
export const useUpdatePatientDetails = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  return useMutation<PatientWithAdditionalData, Error, UpdatePatientDetailsRequest>({
    mutationFn: changes => api.put('me', changes as any) as Promise<PatientWithAdditionalData>,
    onSuccess: patient => {
      queryClient.setQueryData(['me'], patient);
    },
  });
};
