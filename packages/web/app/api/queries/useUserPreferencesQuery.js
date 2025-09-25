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

// Admin variant uses central-server admin route
export const useAdminUserPreferencesQuery = (queryOptions) => {
  const api = useApi();
  const { currentUser, facilityId } = useAuth();

  return useQuery(
    ['adminUserPreferences', currentUser?.id],
    () => api.get(`admin/user/userPreferences/${encodeURIComponent(facilityId)}`),
    queryOptions,
  );
};
