import { useQuery } from '@tanstack/react-query';

import {
  UpcomingVaccinationSchema,
  type UpcomingVaccination,
} from '@tamanu/shared/schemas/patientPortal/responses/upcomingVaccination.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';
import { transformArray } from '@utils/transformData';

export const useUpcomingVaccinesQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, UpcomingVaccination[]>({
    queryKey: ['upcomingVaccines', user?.id],
    queryFn: () => api.get('/me/vaccinations/upcoming'),
    enabled: !!user?.id,
    select: transformArray<UpcomingVaccination>(UpcomingVaccinationSchema),
  });
};
