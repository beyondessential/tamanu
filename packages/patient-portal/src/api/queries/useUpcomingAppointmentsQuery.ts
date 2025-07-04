import { useQuery } from '@tanstack/react-query';
import {
  AppointmentSchema,
  type Appointment,
} from '@tamanu/shared/dtos/responses/AppointmentSchema';

import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

interface UpcomingAppointmentsResponse {
  data: unknown[];
  count: number;
}

const transformData = (response: unknown): Appointment[] => {
  const parsedResponse = response as UpcomingAppointmentsResponse;
  return parsedResponse.data.map(item => AppointmentSchema.parse(item));
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
