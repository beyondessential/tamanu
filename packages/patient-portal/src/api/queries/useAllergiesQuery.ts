import { useQuery } from '@tanstack/react-query';
import { type Allergy } from '@tamanu/shared/schemas/patientPortal/responses/allergy.schema';
import { AllergySchema } from '@tamanu/shared/schemas/patientPortal/responses/allergy.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): Allergy[] => {
  const responseData = response as { data: unknown[] };
  if (!responseData.data) {
    return [];
  }

  return responseData.data.map(item => AllergySchema.parse(item));
};

export const useAllergiesQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, Allergy[]>({
    queryKey: ['allergies', user?.id],
    queryFn: () => api.get('/me/allergies'),
    enabled: !!user?.id,
    select: transformData,
  });
};
