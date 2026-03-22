import { useQuery } from '@tanstack/react-query';
import { type UpcomingVaccination } from '@tamanu/shared/schemas/patientPortal';
import { useApi } from '../useApi';

export const useUpcomingVaccinesQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, UpcomingVaccination[]>({
    queryKey: ['upcomingVaccines'],
    queryFn: () => api.get('me/vaccinations/upcoming'),
  });
};
