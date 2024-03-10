import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAddressHierarchy = queryParams => {
  const api = useApi();

  return useQuery(['addressHierarchy', queryParams], () =>
    api.get(`addressHierarchy`, queryParams),
  );
};
