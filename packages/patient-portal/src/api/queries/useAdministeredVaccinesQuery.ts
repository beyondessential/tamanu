import { useQuery } from '@tanstack/react-query';
import { type AdministeredVaccine } from '@tamanu/shared/schemas/patientPortal';
import { useApi } from '../useApi';

export const useAdministeredVaccinesQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, AdministeredVaccine[]>({
    queryKey: ['administeredVaccines'],
    queryFn: () => api.get('me/vaccinations/administered'),
  });
};
