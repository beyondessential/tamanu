import { useMutation } from '@tanstack/react-query';

import { useApi } from '../useApi';
import { useAuth } from '../../contexts/Auth';

export const useSendAppointmentEmail = (appointmentId, useMutationOptions) => {
  const { facilityId } = useAuth();
  const api = useApi();
  return useMutation(
    (email) => api.post('appointments/emailReminder', { appointmentId, email, facilityId }),
    useMutationOptions,
  );
};
