import { useQuery } from '@tanstack/react-query';

import {
  AppointmentSchema,
  type Appointment,
} from '@tamanu/shared/schemas/patientPortal/responses/appointment.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';
import { transformArray } from '@utils/transformData';

export const useUpcomingAppointmentsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, Appointment[]>({
    queryKey: ['upcomingAppointments', user?.id],
    queryFn: () => api.get('/me/appointments/upcoming'),
    enabled: !!user?.id,
    select: transformArray<Appointment>(AppointmentSchema),
  });
};
