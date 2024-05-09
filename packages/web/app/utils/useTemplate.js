import { useQuery } from '@tanstack/react-query';

import { useApi } from '../api';
import { useAuth } from '../contexts/Auth';

export const useTemplate = key => {
  const api = useApi();
  const { facilityId } = useAuth();

  return useQuery(['template', key, facilityId], () => api.get(`template/${key}`, { facilityId }));
};
