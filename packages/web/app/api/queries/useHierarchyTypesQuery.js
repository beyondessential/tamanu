import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useHierarchyTypesQuery = queryParams => {
  const api = useApi();

  return useQuery(['addressHierarchyTypes', queryParams], () =>
    api.get('referenceData/addressHierarchyTypes', queryParams),
  );
};
