import { useQuery } from '@tanstack/react-query';

import {
  OngoingPrescriptionSchema,
  type OngoingPrescription,
} from '@tamanu/shared/schemas/patientPortal/responses/ongoingPrescription.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';
import { transformArray } from '@utils/transformData';

export const useMedicationsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, OngoingPrescription[]>({
    queryKey: ['medications', user?.id],
    queryFn: () => api.get('/me/ongoing-prescriptions'),
    enabled: !!user?.id,
    select: transformArray<OngoingPrescription>(OngoingPrescriptionSchema),
  });
};
