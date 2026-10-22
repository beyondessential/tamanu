import { useMutation, useQuery } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';

import { useApi } from '../../api';

export const useFindKioskAppointmentsMutation = () => {
  const api = useApi();
  return useMutation(({ lastName, dateOfBirth }) =>
    api.get('kiosk/appointments', { lastName, dateOfBirth }),
  );
};

/** The confirmed appointment with the patient's record and the forms to complete. */
export const useKioskAppointmentQuery = appointmentId => {
  const api = useApi();
  return useQuery(
    ['kioskAppointment', appointmentId],
    () => api.get(route('kiosk/appointments/:appointmentId', { appointmentId })),
    {
      enabled: Boolean(appointmentId),
      // Each patient's record is dropped as soon as their session ends
      cacheTime: 0,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
    },
  );
};

export const useKioskCheckInMutation = appointmentId => {
  const api = useApi();
  return useMutation(responses =>
    api.post(route('kiosk/appointments/:appointmentId/checkIn', { appointmentId }), { responses }),
  );
};
