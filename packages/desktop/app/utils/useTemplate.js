import { useQuery } from '@tanstack/react-query';

import { useApi } from '../api';
import { useAuth } from '../contexts/Auth';

export const useTemplate = key => {
  const api = useApi();
  const { facility } = useAuth();

  return useQuery(['template', key, facility.id], () =>
    api.get(`template/${key}?facilityId=${facility.id}`),
  );
};
