import { useQuery } from '@tanstack/react-query';
import { AllergiesArraySchema, type Allergy } from '@tamanu/shared/dtos/responses/AllergySchema';
import { PaginatedResponseSchema } from '@tamanu/shared/dtos/responses/CommonResponseSchemas';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): Allergy[] => {
  const parsedResponse = PaginatedResponseSchema.parse(response);
  if (!parsedResponse.data) {
    return [];
  }

  const parsedData = AllergiesArraySchema.parse(parsedResponse.data);
  return parsedData;
};

export const useAllergiesQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, Allergy[]>({
    queryKey: ['allergies', user?.id],
    queryFn: () => api.get('/patient/me/allergies'),
    enabled: !!user?.id,
    select: transformData,
  });
};
