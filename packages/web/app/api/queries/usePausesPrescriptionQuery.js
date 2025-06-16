import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { isErrorUnknownAllow404s } from '../TamanuApi';

export const usePausesPrescriptionQuery = (prescriptionId, encounterId, fetchOptions) => {
  const api = useApi();

  return useQuery(
    [`medication/${prescriptionId}/pauses`, encounterId, fetchOptions],
    () =>
      api.get(
        `medication/${prescriptionId}/pauses`,
        { encounterId, ...fetchOptions },
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    {
      enabled: !!prescriptionId && !!encounterId,
    },
  );
};
