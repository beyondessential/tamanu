import { useQuery } from '@tanstack/react-query';

import {
  OngoingPrescriptionSchema,
  type OngoingPrescription,
} from '@tamanu/shared/schemas/patientPortal/responses/ongoingPrescription.schema';
import { useApi } from '../useApi';
import { transformArray } from '@utils/transformData';

export const useMedicationsQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, OngoingPrescription[]>({
    queryKey: ['ongoingPrescriptions'],
    queryFn: () => api.get('/me/ongoing-prescriptions'),
    select: transformArray<OngoingPrescription>(OngoingPrescriptionSchema),
  });
};
