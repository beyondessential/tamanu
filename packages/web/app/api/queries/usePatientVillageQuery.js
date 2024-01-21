import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const usePatientVillageQuery = villageId => {
  const api = useApi();
  return useQuery(
    ['referenceData', villageId],
    () => api.get(`referenceData/${encodeURIComponent(villageId)}`),
    { enabled: !!villageId },
  );
};
