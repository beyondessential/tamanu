import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { type PortalProfiles } from '@tamanu/shared/schemas/patientPortal';
import type { TamanuApi } from '../TamanuApi';
import { useApi } from '../useApi';
import { LoginCredentials, LoginResponse } from '../types';

export const useLogin = () => {
  const api = useApi() as TamanuApi;
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation<LoginResponse & { profiles: PortalProfiles }, Error, LoginCredentials>({
    mutationFn: async (credentials: LoginCredentials) => {
      const loginResponse = await api.tokenLogin(credentials);
      const profiles: PortalProfiles = await api.get('profiles');
      return { ...loginResponse, profiles };
    },
    onSuccess: async ({ user, profiles }) => {
      // The patient is known straight away, rather than through the failed check from before
      queryClient.setQueryData(['me'], user);
      queryClient.setQueryData(['profiles'], profiles);
      navigate(profiles.data.length > 1 ? '/select-profile' : '/');
    },
  });
};
