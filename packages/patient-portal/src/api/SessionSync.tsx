import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { PORTAL_TOKEN_KEY, type TamanuApi } from './TamanuApi';
import { useApi } from './useApi';

/**
 * Keeps this tab signed in or out in step with the portal's other tabs on the device, so a sign-in
 * page left open elsewhere moves on once the patient signs in, rather than asking for a code that
 * has already been used.
 */
export const SessionSync = () => {
  const api = useApi() as TamanuApi;
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleStorage = async (event: StorageEvent) => {
      if (event.key !== PORTAL_TOKEN_KEY) return;
      await api.syncSession();
      await queryClient.resetQueries();
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [api, queryClient]);

  return null;
};
