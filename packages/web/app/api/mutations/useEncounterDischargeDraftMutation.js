import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { ENCOUNTER_DISCHARGE_DRAFT_QUERY_KEY } from '../queries/useEncounterDischargeDraftQuery';

/**
 * Saving and discarding the requesting clinician's own discharge draft.
 *
 * Both write the endpoint's response straight into the query cache rather than invalidating it:
 * the response is the draft that was just saved, so a refetch would only fetch it back again.
 */
export const useEncounterDischargeDraftMutation = (encounterId, { onSuccess } = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const queryKey = [ENCOUNTER_DISCHARGE_DRAFT_QUERY_KEY, encounterId];
  const endpoint = `encounter/${encounterId}/dischargeDraft`;

  const save = useMutation({
    mutationKey: ['saveDischargeDraft', encounterId],
    mutationFn: payload => api.put(endpoint, payload),
    onSuccess: data => {
      queryClient.setQueryData(queryKey, data);
      onSuccess?.();
    },
  });

  const discard = useMutation({
    mutationKey: ['discardDischargeDraft', encounterId],
    mutationFn: () => api.delete(endpoint),
    onSuccess: data => {
      queryClient.setQueryData(queryKey, data);
      onSuccess?.();
    },
  });

  return {
    saveDraft: save.mutateAsync,
    discardDraft: discard.mutateAsync,
    isSavingDraft: save.isLoading,
    isDiscardingDraft: discard.isLoading,
    draftError: save.error ?? discard.error,
    /** The discharge has cleared every draft on the encounter, so drop the cached copy. */
    forgetDraft: () => queryClient.setQueryData(queryKey, { draft: null }),
  };
};
