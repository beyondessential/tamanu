import { useQuery } from '@tanstack/react-query';
import {
  MedicationsArraySchema,
  type Medication,
} from '@tamanu/shared/dtos/responses/MedicationSchema';
import { ArrayResponseSchema } from '@tamanu/shared/dtos/responses/CommonResponseSchemas';

import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): Medication[] => {
  const parsedResponse = ArrayResponseSchema.parse(response);
  if (!parsedResponse.data) {
    return [];
  }
  return MedicationsArraySchema.parse(parsedResponse.data);
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
