import { useQuery } from '@tanstack/react-query';
import { type OngoingPrescription } from '@tamanu/shared/schemas/patientPortal/responses/ongoingPrescription.schema';
import { OngoingPrescriptionSchema } from '@tamanu/shared/schemas/patientPortal/responses/ongoingPrescription.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): OngoingPrescription[] => {
  const responseData = response as { data: unknown[] };
  if (!responseData.data) {
    return [];
  }

  return responseData.data.map(item => OngoingPrescriptionSchema.parse(item));
};

export const useMedicationsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, OngoingPrescription[]>({
    queryKey: ['medications', user?.id],
    queryFn: () => api.get('/me/ongoing-prescriptions'),
    enabled: !!user?.id,
    select: transformData,
  });
};
