import { useQuery } from '@tanstack/react-query';
import {
  AppointmentSchema,
  type Appointment,
} from '@tamanu/shared/schemas/patientPortal/responses/appointment.schema';
import { useApi } from '../useApi';
import { transformArray } from '@utils/transformData';

export const useUpcomingAppointmentsQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, Appointment[]>({
    queryKey: ['upcomingAppointments'],
    queryFn: () => api.get('/me/appointments/upcoming'),
    select: transformArray<Appointment>(AppointmentSchema),
  });
};
