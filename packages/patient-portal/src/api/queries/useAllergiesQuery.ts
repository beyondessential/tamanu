import { useQuery } from '@tanstack/react-query';

import {
  AllergySchema,
  type Allergy,
} from '@tamanu/shared/schemas/patientPortal/responses/allergy.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';
import { transformArray } from '@utils/transformData';

export const useAllergiesQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, Allergy[]>({
    queryKey: ['allergies', user?.id],
    queryFn: () => api.get('/me/allergies'),
    enabled: !!user?.id,
    select: transformArray<Allergy>(AllergySchema),
  });
};
