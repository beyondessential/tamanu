import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePausePrescriptionQuery = ({ prescriptionId, encounterId }, options) => {
  const api = useApi();

  return useQuery(
    [`medication/${prescriptionId}/pause`, encounterId],
    () => api.get(`medication/${prescriptionId}/pause`, { encounterId }),
    {
      ...options,
    },
  );
};
