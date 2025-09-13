import { useQuery } from '@tanstack/react-query';
import {
  AdministeredVaccineSchema,
  type AdministeredVaccine,
} from '@tamanu/shared/schemas/patientPortal/responses/administeredVaccine.schema';
import { useApi } from '../useApi';
import { transformArray } from '@utils/transformData';

export const useAdministeredVaccinesQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, AdministeredVaccine[]>({
    queryKey: ['administeredVaccines'],
    queryFn: () => api.get('/me/vaccinations/administered'),
    select: transformArray<AdministeredVaccine>(AdministeredVaccineSchema),
  });
};
