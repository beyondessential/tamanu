import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../contexts/Auth';
import { useApi } from '../useApi';

export const useUserPreferencesMutation = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationKey: ['userPreferences'],
    mutationFn: newUserPreferences => {
      return api.post('user/userPreferences', {
        ...newUserPreferences,
      });
    },
    onSuccess: data => {
      queryClient.setQueriesData(['userPreferences', currentUser.id], data);
    },
  });
};

export const useReorderEncounterTabs = () => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: encounterTabOrders => {
      return api.post('user/userPreferences/reorderEncounterTab', {
        encounterTabOrders,
      });
    },
    onSuccess: data => {
      queryClient.setQueriesData(['userPreferences', currentUser.id], data);
    },
  });
};
