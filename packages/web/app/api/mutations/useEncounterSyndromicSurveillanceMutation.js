import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { ENCOUNTER_SYNDROMIC_SURVEILLANCE_QUERY_KEY } from '../queries/useEncounterSyndromicSurveillanceQuery';

/**
 * Recording and editing an encounter's syndromic surveillance data.
 *
 * Writes the endpoint's response straight into the query cache rather than invalidating it: the
 * response is the record that was just saved, so a refetch would only fetch it back again.
 */
export const useEncounterSyndromicSurveillanceMutation = (encounterId, { onSuccess } = {}) => {
  const api = useApi();
  const queryClient = useQueryClient();
  const queryKey = [ENCOUNTER_SYNDROMIC_SURVEILLANCE_QUERY_KEY, encounterId];
  const endpoint = `encounter/${encounterId}/syndromicSurveillance`;

  const create = useMutation({
    mutationKey: ['createEncounterSyndromicSurveillance', encounterId],
    mutationFn: payload => api.post(endpoint, payload),
    onSuccess: data => {
      queryClient.setQueryData(queryKey, data);
      onSuccess?.();
    },
  });

  const edit = useMutation({
    mutationKey: ['editEncounterSyndromicSurveillance', encounterId],
    mutationFn: payload => api.put(endpoint, payload),
    onSuccess: data => {
      queryClient.setQueryData(queryKey, data);
      onSuccess?.();
    },
  });

  return {
    createSyndromicSurveillance: create.mutateAsync,
    editSyndromicSurveillance: edit.mutateAsync,
    isSavingSyndromicSurveillance: create.isLoading || edit.isLoading,
    syndromicSurveillanceError: create.error ?? edit.error,
  };
};
