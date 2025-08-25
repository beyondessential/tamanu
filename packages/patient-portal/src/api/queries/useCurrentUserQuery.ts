import { useQuery } from '@tanstack/react-query';
import {
  PatientSchema,
  type Patient,
} from '@tamanu/shared/schemas/patientPortal/responses/patient.schema';
import { useApi } from '../useApi';
import { transformSingle } from '@utils/transformData';

export const useCurrentUserQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, Patient>({
    queryKey: ['me'],
    queryFn: () => api.get('/me'),
    select: transformSingle<Patient>(PatientSchema),
  });
};
