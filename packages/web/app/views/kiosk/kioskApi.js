import { useMutation, useQuery } from '@tanstack/react-query';

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
    () => api.get(`kiosk/appointments/${encodeURIComponent(appointmentId)}`),
    {
      enabled: Boolean(appointmentId),
      // Kept briefly so a prefetch on "Is this you?" carries over to the forms
      cacheTime: 30 * 1000,
      staleTime: 30 * 1000,
      refetchOnWindowFocus: false,
    },
  );
};

export const useKioskCheckInMutation = appointmentId => {
  const api = useApi();
  return useMutation(responses =>
    api.post(`kiosk/appointments/${encodeURIComponent(appointmentId)}/checkIn`, { responses }),
  );
};
