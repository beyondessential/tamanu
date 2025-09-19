import { useQuery } from '@tanstack/react-query';
import {
  AllergySchema,
  type Allergy,
} from '@tamanu/shared/schemas/patientPortal/responses/allergy.schema';
import { useApi } from '../useApi';
import { transformArray } from '@utils/transformData';

export const useAllergiesQuery = () => {
  const api = useApi();
  return useQuery<unknown, Error, Allergy[]>({
    queryKey: ['allergies'],
    queryFn: () => api.get('/me/allergies'),
    select: transformArray<Allergy>(AllergySchema),
  });
};
