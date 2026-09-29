import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { AI_PATIENT_SUMMARY_QUERY_KEY } from '../queries/useAiPatientSummaryQuery';
import { ENCOUNTER_QUERY_KEY } from '../queries/useEncounterQuery';

export const useCreateEncounterMutation = ({ onSuccess } = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['createEncounter'],
    mutationFn: data => api.post('encounter', data),
    onSuccess: async encounter => {
      if (encounter?.patientId) {
        await queryClient.invalidateQueries([AI_PATIENT_SUMMARY_QUERY_KEY, encounter.patientId]);
      }
      await onSuccess?.(encounter);
    },
  });
};

export const useUpdateEncounterMutation = (encounterId, { onSuccess } = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ['updateEncounter', encounterId],
    mutationFn: data => api.put(`encounter/${encounterId}`, data),
    onSuccess: async encounter => {
      await queryClient.invalidateQueries([ENCOUNTER_QUERY_KEY, encounterId], { exact: true });
      await onSuccess?.(encounter);
    },
  });
};
