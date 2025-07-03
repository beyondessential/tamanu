import { useQuery } from '@tanstack/react-query';
import {
  AdministeredVaccineSchema,
  type AdministeredVaccine,
} from '@tamanu/shared/dtos/responses/AdministeredVaccineSchema';

import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

interface AdministeredVaccinesResponse {
  data: unknown[];
}

const transformData = (response: unknown): AdministeredVaccine[] => {
  const parsedResponse = response as AdministeredVaccinesResponse;
  return parsedResponse.data.map(item => AdministeredVaccineSchema.parse(item));
};

export const useAdministeredVaccinesQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, AdministeredVaccine[]>({
    queryKey: ['administeredVaccines', user?.id],
    queryFn: () => api.get('/patient/me/administeredVaccines'),
    enabled: !!user?.id,
    select: transformData,
  });
};
