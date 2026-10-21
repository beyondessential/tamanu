import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const usePausesPrescriptionQuery = (prescriptionId, encounterId, fetchOptions) => {
  const api = useApi();

  return useQuery(
    [`medication/${prescriptionId}/pauses`, encounterId, fetchOptions],
    () =>
      api.get(route('medication/:prescriptionId/pauses', { prescriptionId }), {
        encounterId,
        ...fetchOptions,
      }),
    {
      enabled: !!prescriptionId && !!encounterId,
    },
  );
};
