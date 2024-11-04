import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useUserPreferencesQuery = ({ enabled = true }) => {
  const api = useApi();
  const { currentUser } = useAuth();

  return useQuery(['userPreferences', currentUser.id], () => api.get('user/userPreferences'), {
    enabled,
  });
};
