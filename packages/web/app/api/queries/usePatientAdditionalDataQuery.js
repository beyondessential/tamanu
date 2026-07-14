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
      // dedupes refetches from components mounting in quick succession during a page
      // load; invalidatePatientDataQueries invalidates this key so edits still show
      staleTime: 30_000,
      ...fetchOptions,
    },
  );
};
