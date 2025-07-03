import { useQuery } from '@tanstack/react-query';
import {
  UpcomingVaccineSchema,
  type UpcomingVaccine,
} from '@tamanu/shared/dtos/responses/UpcomingVaccineSchema';

import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

interface UpcomingVaccinesResponse {
  data: unknown[];
}

const transformData = (response: unknown): UpcomingVaccine[] => {
  const parsedResponse = response as UpcomingVaccinesResponse;
  return parsedResponse.data.map(item => UpcomingVaccineSchema.parse(item));
};

export const useUpcomingVaccinesQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, UpcomingVaccine[]>({
    queryKey: ['upcomingVaccines', user?.id],
    queryFn: () => api.get('/patient/me/upcomingVaccinations'),
    enabled: !!user?.id,
    select: transformData,
  });
};
