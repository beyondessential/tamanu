import { useQuery } from '@tanstack/react-query';
import { type AdministeredVaccine } from '@tamanu/shared/schemas/patientPortal/responses/administeredVaccine.schema';
import { AdministeredVaccineSchema } from '@tamanu/shared/schemas/patientPortal/responses/administeredVaccine.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): AdministeredVaccine[] => {
  const responseData = response as { data: unknown[] };
  if (!responseData.data) {
    return [];
  }

  return responseData.data.map(item => AdministeredVaccineSchema.parse(item));
};

export const useAdministeredVaccinesQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, AdministeredVaccine[]>({
    queryKey: ['administeredVaccines', user?.id],
    queryFn: () => api.get('/me/vaccinations/administered'),
    enabled: !!user?.id,
    select: transformData,
  });
};
