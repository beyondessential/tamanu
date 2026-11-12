import { useQuery } from '@tanstack/react-query';
import { type PatientWithAdditionalData } from '@tamanu/shared/schemas/patientPortal';
import type { TamanuApi } from '../TamanuApi';
import { useApi } from '../useApi';

const isSessionRejected = (error: unknown) => (error as { status?: number })?.status === 401;

export const useCurrentUserQuery = () => {
  const api = useApi() as TamanuApi;

  return useQuery<unknown, Error, PatientWithAdditionalData>({
    queryKey: ['me'],
    queryFn: async () => {
      try {
        return await api.fetchCurrentUser();
      } catch (error) {
        if (!isSessionRejected(error)) throw error;
        // A session the server no longer accepts isn't kept, unless another tab has signed in
        if (await api.forgetRejectedSession()) return api.fetchCurrentUser();
        throw error;
      }
    },
  });
};
