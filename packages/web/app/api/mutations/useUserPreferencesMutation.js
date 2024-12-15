import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '../../contexts/Auth';
import { useApi } from '../useApi';

// Supplying a facilityId means the preference will be applied only when logged in to that facility
export const useUserPreferencesMutation = facilityId => {
  const api = useApi();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  return useMutation({
    mutationKey: ['userPreferences'],
    mutationFn: newUserPreferences =>
      api.post('user/userPreferences', { ...facilityId, ...newUserPreferences }),
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
