import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { AI_PATIENT_SUMMARY_QUERY_KEY } from '../queries/useAiPatientSummaryQuery';

export const useGenerateAiPatientSummary = patientId => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post(`ai/patient/summary/${encodeURIComponent(patientId)}`),
    onSuccess: () => {
      queryClient.invalidateQueries([AI_PATIENT_SUMMARY_QUERY_KEY, patientId]);
    },
  });
};

export const useSaveAiPatientSummary = patientId => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }) =>
      api.put(`ai/patient/summary/${encodeURIComponent(id)}`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries([AI_PATIENT_SUMMARY_QUERY_KEY, patientId]);
    },
  });
};

export const useDiscardAiPatientSummary = patientId => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: id =>
      api.put(`ai/patient/summary/${encodeURIComponent(id)}`, {
        content: null,
        status: 'discarded',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries([AI_PATIENT_SUMMARY_QUERY_KEY, patientId]);
    },
  });
};
