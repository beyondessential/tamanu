import { useQuery } from '@tanstack/react-query';

import { type OngoingPrescription } from '@tamanu/shared/schemas/patientPortal';
import { useApi } from '../useApi';

export const useMedicationsQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, OngoingPrescription[]>({
    queryKey: ['ongoingPrescriptions'],
    queryFn: () => api.get('me/ongoing-prescriptions'),
  });
};
