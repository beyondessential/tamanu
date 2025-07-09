import { useQuery } from '@tanstack/react-query';
import {
  AppointmentsArraySchema,
  type Appointment,
} from '@tamanu/shared/dtos/responses/AppointmentSchema';

import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';
import { ArrayResponseSchema } from '@tamanu/shared/dtos/responses/CommonResponseSchemas';

const transformData = (response: unknown): Appointment[] => {
  const parsedResponse = ArrayResponseSchema.parse(response);
  if (!parsedResponse.data) {
    return [];
  }

  return AppointmentsArraySchema.parse(parsedResponse.data);
};

export const useUpcomingAppointmentsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, Appointment[]>({
    queryKey: ['upcomingAppointments', user?.id],
    queryFn: () => api.get('/patient/me/appointments'),
    enabled: !!user?.id,
    select: transformData,
  });
};
