import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const usePatientAdditionalDataQuery = (patientId, fetchOptions) => {
  const api = useApi();
  const { facilityId } = useAuth();
  return useQuery(
    ['additionalData', patientId],
    () => api.get(`patient/${encodeURIComponent(patientId)}/additionalData`, { facilityId }),
    {
      enabled: Boolean(patientId),
      // Short window to dedupe the burst of fetches when a patient opens. Kept short so a
      // PAD edit from another client shows within a few seconds; local edits invalidate
      // this key immediately via invalidatePatientDataQueries.
      staleTime: 5_000,
      ...fetchOptions,
    },
  );
};
