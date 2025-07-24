import { useQuery } from '@tanstack/react-query';
import { type Appointment } from '@tamanu/shared/schemas/patientPortal/responses/appointment.schema';
import { AppointmentSchema } from '@tamanu/shared/schemas/patientPortal/responses/appointment.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): Appointment[] => {
  const responseData = response as { data: unknown[] };
  if (!responseData.data) {
    return [];
  }

  return responseData.data.map(item => AppointmentSchema.parse(item));
};

export const useUpcomingAppointmentsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, Appointment[]>({
    queryKey: ['upcomingAppointments', user?.id],
    queryFn: () => api.get('/me/appointments/upcoming'),
    enabled: !!user?.id,
    select: transformData,
  });
};
