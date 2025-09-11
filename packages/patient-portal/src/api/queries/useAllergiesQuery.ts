import { useQuery } from '@tanstack/react-query';
import {
  type Allergy,
} from '@tamanu/shared/schemas/patientPortal/responses/allergy.schema';
import { useApi } from '../useApi';

export const useAllergiesQuery = () => {
  const api = useApi();
  return useQuery<unknown, Error, Allergy[]>({
    queryKey: ['allergies'],
    queryFn: () => api.get('/me/allergies'),
  });
};
