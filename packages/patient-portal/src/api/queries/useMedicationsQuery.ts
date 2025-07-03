import { useQuery } from '@tanstack/react-query';
import { MedicationSchema, type Medication } from '@tamanu/shared/dtos/responses/MedicationSchema';

import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

interface MedicationsResponse {
  data: unknown[];
}

const transformData = (response: unknown): Medication[] => {
  const parsedResponse = response as MedicationsResponse;
  return parsedResponse.data.map(item => MedicationSchema.parse(item));
};

export const useMedicationsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, Medication[]>({
    queryKey: ['medications', user?.id],
    queryFn: () => api.get('/patient/me/medications'),
    enabled: !!user?.id,
    select: transformData,
  });
};
