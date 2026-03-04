import { useQuery } from '@tanstack/react-query';
import { type PatientWithAdditionalData } from '@tamanu/shared/schemas/patientPortal';
import { useApi } from '../useApi';

export const useCurrentUserQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, PatientWithAdditionalData>({
    queryKey: ['me'],
    queryFn: () => api.get('me'),
  });
};
