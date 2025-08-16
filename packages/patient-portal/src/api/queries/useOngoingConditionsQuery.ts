import { useQuery } from '@tanstack/react-query';

import {
  OngoingConditionSchema,
  type OngoingCondition,
} from '@tamanu/shared/schemas/patientPortal/responses/ongoingCondition.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';
import { transformArray } from '@utils/transformData';

export const useOngoingConditionsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, OngoingCondition[]>({
    queryKey: ['ongoingConditions', user?.id],
    queryFn: () => api.get('/me/ongoing-conditions'),
    enabled: !!user?.id,
    select: transformArray<OngoingCondition>(OngoingConditionSchema),
  });
};
