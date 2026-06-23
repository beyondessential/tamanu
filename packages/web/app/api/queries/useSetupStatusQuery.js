import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

// Unauthenticated check used pre-login to decide whether to show the first-run
// setup wizard. Only facility servers expose this endpoint; on central (404) or
// any error we treat the server as configured so the wizard never blocks login.
export const useSetupStatusQuery = () => {
  const api = useApi();

  return useQuery(
    ['setupStatus'],
    async () => {
      try {
        const { configured } = await api.get(
          'public/setup/status',
          {},
          { useAuthToken: false, waitForAuth: false, showUnknownErrorToast: false },
        );
        return { configured };
      } catch {
        return { configured: true };
      }
    },
    { staleTime: Infinity },
  );
};
