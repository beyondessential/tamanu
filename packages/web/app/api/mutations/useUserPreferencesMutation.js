import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useUserPreferencesMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationKey: ['userPreferences'],
    mutationFn: newUserPreferences => {
      return api.post(`user/userPreferences`, {
        ...newUserPreferences,
      });
    },
    onSuccess: requestData => {
      queryClient.setQueriesData(['userPreferences', currentUser.id], oldPreferences => {
        oldPreferences[requestData.key] = requestData.value;
        return oldPreferences;
      });
    },
  });
};
