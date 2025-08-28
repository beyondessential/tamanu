import { useQuery } from '@tanstack/react-query';
import {
  UpcomingVaccinationSchema,
  type UpcomingVaccination,
} from '@tamanu/shared/schemas/patientPortal/responses/upcomingVaccination.schema';
import { useApi } from '../useApi';
import { transformArray } from '@utils/transformData';

export const useUpcomingVaccinesQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, UpcomingVaccination[]>({
    queryKey: ['upcomingVaccines'],
    queryFn: () => api.get('/me/vaccinations/upcoming'),
    select: transformArray<UpcomingVaccination>(UpcomingVaccinationSchema),
  });
};
