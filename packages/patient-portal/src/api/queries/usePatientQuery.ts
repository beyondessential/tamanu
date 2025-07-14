import { useQuery } from '@tanstack/react-query';
import { PatientSchema, type Patient } from '@tamanu/shared/schemas/responses/patient.schema';

import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): Patient => {
  return PatientSchema.parse(response);
};

export const usePatientQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, Patient>({
    queryKey: ['patient', user?.id],
    queryFn: () => api.get('/patient/me'),
    enabled: !!user?.id,
    select: transformData,
  });
};
