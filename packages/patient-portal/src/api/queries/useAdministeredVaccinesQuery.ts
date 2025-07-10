import { useQuery } from '@tanstack/react-query';
import {
  AdministeredVaccinesArraySchema,
  type AdministeredVaccine,
} from '@tamanu/shared/dtos/responses/AdministeredVaccineSchema';
import { ArrayResponseSchema } from '@tamanu/shared/dtos/responses/CommonResponseSchemas';

import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): AdministeredVaccine[] => {
  const parsedResponse = ArrayResponseSchema.parse(response);
  if (!parsedResponse.data) {
    return [];
  }
  return AdministeredVaccinesArraySchema.parse(parsedResponse.data);
};

export const useAdministeredVaccinesQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, AdministeredVaccine[]>({
    queryKey: ['administeredVaccines', user?.id],
    queryFn: () => api.get('/patient/me/vaccinations/administered'),
    enabled: !!user?.id,
    select: transformData,
  });
};
