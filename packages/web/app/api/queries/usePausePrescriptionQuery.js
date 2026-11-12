import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const usePausePrescriptionQuery = ({ prescriptionId, encounterId }, options) => {
  const api = useApi();

  return useQuery(
    [`medication/${prescriptionId}/pause`, encounterId],
    () => api.get(route('medication/:prescriptionId/pause', { prescriptionId }), { encounterId }),
    {
      ...options,
    },
  );
};
