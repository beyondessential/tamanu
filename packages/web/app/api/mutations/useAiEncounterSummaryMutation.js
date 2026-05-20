import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { AI_ENCOUNTER_SUMMARY_QUERY_KEY } from '../queries/useAiEncounterSummaryQuery';

const writeAiDocumentToCache = (queryClient, encounterId, aiDocument) => {
  queryClient.setQueryData([AI_ENCOUNTER_SUMMARY_QUERY_KEY, encounterId], {
    aiDocument,
  });
};

export const useGenerateAiEncounterSummary = encounterId => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post(`ai/encounter/summary/${encodeURIComponent(encounterId)}`),
    onSuccess: aiDocument => writeAiDocumentToCache(queryClient, encounterId, aiDocument),
  });
};

const useUpdateAiEncounterSummary = (encounterId, getRequest) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: input => {
      const { id, body } = getRequest(input);
      return api.put(`ai/encounter/summary/${encodeURIComponent(id)}`, body);
    },
    onSuccess: aiDocument => writeAiDocumentToCache(queryClient, encounterId, aiDocument),
  });
};

export const useSaveAiEncounterSummary = encounterId =>
  useUpdateAiEncounterSummary(encounterId, ({ id, content }) => ({
    id,
    body: { content, status: 'edited' },
  }));

export const useDiscardAiEncounterSummary = encounterId =>
  useUpdateAiEncounterSummary(encounterId, id => ({
    id,
    body: { status: 'discarded' },
  }));
