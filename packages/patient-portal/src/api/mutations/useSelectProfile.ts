import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { route } from '@tamanu/api-client';
import type { TamanuApi } from '../TamanuApi';
import { useApi } from '../useApi';

export const useSelectProfile = () => {
  const api = useApi() as TamanuApi;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<void, Error, string>({
    mutationFn: async portalUserId => {
      const { token } = await api.post(route('profiles/:portalUserId/select', { portalUserId }));
      await api.setToken(token);
    },
    onSuccess: async () => {
      // Everything cached belongs to the previous patient
      await queryClient.resetQueries();
      navigate('/');
    },
    onError: () => queryClient.invalidateQueries({ queryKey: ['profiles'] }),
  });
};
