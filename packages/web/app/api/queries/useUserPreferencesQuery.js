import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useSelector } from 'react-redux';
import { getCurrentUser } from '../../store/auth';
import { route } from '@tamanu/api-client';

export const useUserPreferencesQuery = queryOptions => {
  const api = useApi();
  // Read from the store rather than useAuth, so tables using this need no router around them
  const currentUser = useSelector(getCurrentUser);
  const facilityId = useSelector(({ auth }) => auth.facilityId);

  return useQuery(
    ['userPreferences', currentUser?.id],
    () => api.get(route('user/userPreferences/:facilityId', { facilityId })),
    // dedupes refetches from components mounting in quick succession during a page
    // load; the mutation invalidates this key so edits still show immediately
    { staleTime: 30_000, ...queryOptions },
  );
};
