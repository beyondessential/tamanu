import { useQuery } from '@tanstack/react-query';
import {
  type Patient,
} from '@tamanu/shared/schemas/patientPortal/responses/patient.schema';
import { useApi } from '../useApi';

export const useCurrentUserQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, Patient>({
    queryKey: ['me'],
    queryFn: () => api.get('me'),
  });
};
