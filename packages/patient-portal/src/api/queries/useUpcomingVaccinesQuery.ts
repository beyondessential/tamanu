import { useQuery } from '@tanstack/react-query';
import { type UpcomingVaccination } from '@tamanu/shared/schemas/patientPortal/responses/upcomingVaccination.schema';
import { UpcomingVaccinationSchema } from '@tamanu/shared/schemas/patientPortal/responses/upcomingVaccination.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): UpcomingVaccination[] => {
  const responseData = response as { data: unknown[] };
  if (!responseData.data) {
    return [];
  }

  return responseData.data.map(item => UpcomingVaccinationSchema.parse(item));
};

export const useUpcomingVaccinesQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, UpcomingVaccination[]>({
    queryKey: ['upcomingVaccines', user?.id],
    queryFn: () => api.get('/me/vaccinations/upcoming'),
    enabled: !!user?.id,
    select: transformData,
  });
};
