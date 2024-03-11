import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAddressHierarchyQuery = queryParams => {
  const api = useApi();

  return useQuery(['addressHierarchy', queryParams], () =>
    api.get(`addressHierarchy`, queryParams),
  );
};
