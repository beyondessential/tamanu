import { useQuery } from '@tanstack/react-query';

import {
  PatientSchema,
  type Patient,
} from '@tamanu/shared/schemas/patientPortal/responses/patient.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';
import { transformSingle } from '@utils/transformData';

export const usePatientQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, Patient>({
    queryKey: ['patient', user?.id],
    queryFn: () => api.get('/me'),
    enabled: !!user?.id,
    select: transformSingle<Patient>(PatientSchema),
  });
};
