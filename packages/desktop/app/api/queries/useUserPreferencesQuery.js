import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/Auth';
import { useApi } from '../useApi';

export const useUserPreferencesQuery = () => {
  const api = useApi();
  const { currentUser } = useAuth();

  return useQuery(['userPreferences', currentUser.id], () => api.get('user/userPreferences'));
};
