import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { isErrorUnknownAllow404s } from '../TamanuApi';

export const usePausePrescriptionQuery = ({ prescriptionId, encounterId }, options) => {
  const api = useApi();

  return useQuery(
    [`medication/${prescriptionId}/pause`, encounterId],
    () =>
      api.get(
        `medication/${prescriptionId}/pause`,
        { encounterId },
        { isErrorUnknown: isErrorUnknownAllow404s },
      ),
    {
      ...options,
    },
  );
};
