import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAppointments = options => {
  const api = useApi();

  return useQuery(['appointments', options], () => api.get('appointments', options));
};
