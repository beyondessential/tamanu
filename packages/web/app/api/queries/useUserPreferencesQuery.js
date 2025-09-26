import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useUserPreferencesQuery = (queryOptions) => {
  const api = useApi();
  const { currentUser, facilityId } = useAuth();

  return useQuery(
    ['userPreferences', currentUser?.id],
    () => api.get(`user/userPreferences/${encodeURIComponent(facilityId)}`),
    queryOptions,
  );
};
