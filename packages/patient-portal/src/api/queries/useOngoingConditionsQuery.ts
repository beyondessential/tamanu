import { useQuery } from '@tanstack/react-query';
import { type OngoingCondition } from '@tamanu/shared/schemas/patientPortal';
import { useApi } from '../useApi';

export const useOngoingConditionsQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, OngoingCondition[]>({
    queryKey: ['ongoingConditions'],
    queryFn: () => api.get('me/ongoing-conditions'),
  });
};
