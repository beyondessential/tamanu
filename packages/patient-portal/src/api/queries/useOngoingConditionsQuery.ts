import { useQuery } from '@tanstack/react-query';
import {
  OngoingConditionSchema,
  type OngoingCondition,
} from '@tamanu/shared/schemas/patientPortal/responses/ongoingCondition.schema';
import { useApi } from '../useApi';
import { transformArray } from '@utils/transformData';

export const useOngoingConditionsQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, OngoingCondition[]>({
    queryKey: ['ongoingConditions'],
    queryFn: () => api.get('/me/ongoing-conditions'),
    select: transformArray<OngoingCondition>(OngoingConditionSchema),
  });
};
