import { useQuery } from '@tanstack/react-query';
import {
  OngoingConditionsArraySchema,
  type OngoingCondition,
} from '@tamanu/shared/dtos/responses/OngoingConditionSchema';
import { PaginatedResponseSchema } from '@tamanu/shared/dtos/responses/CommonResponseSchemas';

import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): OngoingCondition[] => {
  const parsedResponse = PaginatedResponseSchema.parse(response);
  if (!parsedResponse.data) {
    return [];
  }

  const parsedData = OngoingConditionsArraySchema.parse(parsedResponse.data);
  return parsedData.filter((condition: OngoingCondition) => !condition.resolved);
};

export const useOngoingConditionsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, OngoingCondition[]>({
    queryKey: ['ongoing-conditions', user?.id],
    queryFn: () => api.get('/patient/me/ongoing-conditions'),
    enabled: !!user?.id,
    select: transformData,
  });
};
