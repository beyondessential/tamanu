import { useQuery } from '@tanstack/react-query';
import {
  UpcomingVaccinesArraySchema,
  type UpcomingVaccine,
} from '@tamanu/shared/dtos/responses/UpcomingVaccineSchema';
import { ArrayResponseSchema } from '@tamanu/shared/dtos/responses/CommonResponseSchemas';

import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): UpcomingVaccine[] => {
  const parsedResponse = ArrayResponseSchema.parse(response);
  if (!parsedResponse.data) {
    return [];
  }
  return UpcomingVaccinesArraySchema.parse(parsedResponse.data);
};

export const useUpcomingVaccinesQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, UpcomingVaccine[]>({
    queryKey: ['upcomingVaccines', user?.id],
    queryFn: () => api.get('/patient/me/vaccinations/upcoming'),
    enabled: !!user?.id,
    select: transformData,
  });
};
