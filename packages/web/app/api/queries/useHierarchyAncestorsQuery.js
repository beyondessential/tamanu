import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useHierarchyAncestorsQuery = (id, queryParams) => {
  const api = useApi();

  return useQuery(
    ['hierarchyAncestors', id],
    () => api.get(`referenceData/${id}/ancestors`, queryParams),
    { enabled: !!id },
  );
};
