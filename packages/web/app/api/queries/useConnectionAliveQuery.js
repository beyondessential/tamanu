import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useConnectionAliveQuery = () => {
  const api = useApi();

  return useQuery(['connectionAlive'], () => api.checkConnectionAlive());
};
