import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';
import { route } from '@tamanu/api-client';

export const useUserPreferencesQuery = queryOptions => {
  const api = useApi();
  const { currentUser, facilityId } = useAuth();

  return useQuery(
    ['userPreferences', currentUser?.id],
    () => api.get(route('user/userPreferences/:facilityId', { facilityId })),
    // dedupes refetches from components mounting in quick succession during a page
    // load; the mutation invalidates this key so edits still show immediately
    { staleTime: 30_000, ...queryOptions },
  );
};
