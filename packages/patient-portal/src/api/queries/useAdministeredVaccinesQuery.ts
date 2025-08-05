import { useQuery } from '@tanstack/react-query';
import {
  AdministeredVaccineSchema,
  type AdministeredVaccine,
} from '@tamanu/shared/schemas/patientPortal/responses/administeredVaccine.schema';
import { useAuth } from '@auth/useAuth';
import { useApi } from '../useApi';
import { transformArray } from '@utils/transformData';

export const useAdministeredVaccinesQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, AdministeredVaccine[]>({
    queryKey: ['administeredVaccines', user?.id],
    queryFn: () => api.get('/me/vaccinations/administered'),
    enabled: !!user?.id,
    select: transformArray<AdministeredVaccine>(AdministeredVaccineSchema),
  });
};
