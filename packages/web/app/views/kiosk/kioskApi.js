import { useMutation, useQuery } from '@tanstack/react-query';
import { route } from '@tamanu/api-client';

import { useApi } from '../../api';

/** The facility the kiosk is signed in to, readable with only permission to run the kiosk. */
export const useKioskFacilityQuery = () => {
  const api = useApi();
  return useQuery(['kioskFacility'], () => api.get('kiosk/facility'));
};

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

/**
 * Submits one finished form, which can't be changed from the kiosk afterwards. Takes a function
 * that builds the response, so a failure building it fails the submission.
 */
export const useKioskSubmitFormMutation = appointmentId => {
  const api = useApi();
  return useMutation(async ({ surveyId, buildResponse }) => {
    const response = await buildResponse();
    return api.post(
      route('kiosk/appointments/:appointmentId/forms/:surveyId', { appointmentId, surveyId }),
      response,
    );
  });
};

/** Marks the appointment Arrived, once every form has been submitted. */
export const useKioskCheckInMutation = appointmentId => {
  const api = useApi();
  return useMutation(() =>
    api.post(route('kiosk/appointments/:appointmentId/checkIn', { appointmentId })),
  );
};
