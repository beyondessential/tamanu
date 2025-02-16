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
    mutationFn: ({ key, value }) => api.post('user/userPreferences', { facilityId, key, value }),
    onSuccess: () => queryClient.invalidateQueries(['userPreferences', currentUser?.id]),
  });
};
