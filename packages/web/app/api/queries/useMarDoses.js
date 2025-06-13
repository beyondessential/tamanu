import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useMarDoses = marId => {
  const api = useApi();
  return useQuery(
    ['marDoses', marId],
    () => api.get(`medication/medication-administration-record/${marId}/doses`),
    {
      enabled: !!marId,
    },
  );
};
