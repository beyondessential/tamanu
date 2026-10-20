import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useHierarchyAncestorsQuery = (id, queryParams) => {
  const api = useApi();

  return useQuery(
    ['hierarchyAncestors', id],
    () => api.get(route('referenceData/:id/ancestors', { id }), queryParams),
    { enabled: !!id },
  );
};
