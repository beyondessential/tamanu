import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { AI_ENCOUNTER_SUMMARY_QUERY_KEY } from '../queries/useAiEncounterSummaryQuery';
import { route } from '@tamanu/api-client';

const writeAiDocumentToCache = (queryClient, encounterId, aiDocument) => {
  queryClient.setQueryData([AI_ENCOUNTER_SUMMARY_QUERY_KEY, encounterId], {
    aiDocument,
  });
};

export const useGenerateAiEncounterSummary = encounterId => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.post(route('ai/encounter/summary/:encounterId', { encounterId })),
    onSuccess: aiDocument => writeAiDocumentToCache(queryClient, encounterId, aiDocument),
  });
};

const useUpdateAiEncounterSummary = (encounterId, getRequest) => {
  const api = useApi();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: input => {
      const { id, body } = getRequest(input);
      return api.put(route('ai/encounter/summary/:id', { id }), body);
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
  useUpdateAiEncounterSummary(encounterId, ({ id }) => ({
    id,
    body: { status: 'discarded' },
  }));
