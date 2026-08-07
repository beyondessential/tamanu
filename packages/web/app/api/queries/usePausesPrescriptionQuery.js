import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePausesPrescriptionQuery = (prescriptionId, encounterId, fetchOptions) => {
  const api = useApi();

  return useQuery(
    [`medication/${prescriptionId}/pauses`, encounterId, fetchOptions],
    () => api.get(`medication/${prescriptionId}/pauses`, { encounterId, ...fetchOptions }),
    {
      enabled: !!prescriptionId && !!encounterId,
    },
  );
};
