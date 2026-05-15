import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { AI_PATIENT_SUMMARY_QUERY_KEY } from '../queries/useAiPatientSummaryQuery';

// The POST/PUT endpoints return an aiDocument directly; the GET query holds a
// `{ aiDocument, requiresRegeneration }` shape, so when a mutation succeeds we
// write the new document straight into the query cache. This keeps the UI in
// sync without waiting on a refetch and avoids stale data from prior mutations
// being preferred over the latest server state.
const writeAiDocumentToCache = (queryClient, patientId, aiDocument) => {
  queryClient.setQueryData([AI_PATIENT_SUMMARY_QUERY_KEY, patientId], {
    aiDocument,
    requiresRegeneration: false,
  });
};

export const useGenerateAiPatientSummary = patientId => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post(`ai/patient/summary/${encodeURIComponent(patientId)}`),
    onSuccess: aiDocument => writeAiDocumentToCache(queryClient, patientId, aiDocument),
  });
};

export const useSaveAiPatientSummary = patientId => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }) =>
      api.put(`ai/patient/summary/${encodeURIComponent(id)}`, { content }),
    onSuccess: aiDocument => writeAiDocumentToCache(queryClient, patientId, aiDocument),
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
    onSuccess: aiDocument => writeAiDocumentToCache(queryClient, patientId, aiDocument),
  });
};
