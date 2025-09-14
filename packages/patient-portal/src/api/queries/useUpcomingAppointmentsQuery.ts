import { useQuery } from '@tanstack/react-query';
import { type Appointment } from '@tamanu/shared/schemas/patientPortal';
import { useApi } from '../useApi';

export const useUpcomingAppointmentsQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, Appointment[]>({
    queryKey: ['upcomingAppointments'],
    queryFn: () => api.get('me/appointments/upcoming'),
  });
};
