import { useQuery } from '@tanstack/react-query';
import {
  OngoingConditionsArraySchema,
  type OngoingCondition,
} from '@tamanu/shared/dtos/responses/OngoingConditionSchema';

import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: { data: unknown; count: number }): OngoingCondition[] => {
  if (!response?.data) {
    return [];
  }

  const parsedData = OngoingConditionsArraySchema.parse(response.data);
  return parsedData.filter((condition: OngoingCondition) => !condition.resolved);
};

export const useOngoingConditionsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<{ data: unknown; count: number }, Error, OngoingCondition[]>({
    queryKey: ['ongoing-conditions', user?.id],
    queryFn: () => api.get('/patient/me/ongoing-conditions'),
    enabled: !!user?.id,
    select: transformData,
  });
};
