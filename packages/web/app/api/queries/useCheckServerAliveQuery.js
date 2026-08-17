import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useCheckServerAliveQuery = () => {
  const api = useApi();

  return useQuery(['serverAlive'], () => api.checkServerAlive(), {
    // only while there's a first sync to watch advance
    refetchInterval: data => (data?.initialSyncPhase ? 10_000 : false),
  });
};
