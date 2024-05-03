import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useSettingsQuery = (id, queryParams) => {
  const api = useApi();

  return useQuery(['settings', id, queryParams], () => api.get(`setting/${id}`, queryParams));
};
