import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useCheckServerAliveQuery = () => {
  const api = useApi();

  return useQuery(['serverAlive'], () => api.checkServerAlive());
};
