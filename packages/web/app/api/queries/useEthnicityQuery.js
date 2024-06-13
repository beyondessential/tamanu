import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useEthnicityQuery = (ethnicityId, enabled) => {
  const api = useApi();

  return useQuery(
    ['ethnicity', ethnicityId],
    () => api.get(`referenceData/${encodeURIComponent(ethnicityId)}`),
    { enabled },
  );
};
