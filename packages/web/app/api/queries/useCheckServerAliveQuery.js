import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useCheckServerAliveQuery = () => {
  const api = useApi();

  return useQuery(['serverAlive'], () => api.checkServerAlive(), {
    // spec: FSETUP#setting-up-screen
    // only while there's a first sync to wait for
    refetchInterval: data => (data?.isSettingUp ? 10_000 : false),
  });
};
