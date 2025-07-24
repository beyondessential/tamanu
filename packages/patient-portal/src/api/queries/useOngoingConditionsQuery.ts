import { useQuery } from '@tanstack/react-query';
import { type OngoingCondition } from '@tamanu/shared/schemas/patientPortal/responses/ongoingCondition.schema';
import { OngoingConditionSchema } from '@tamanu/shared/schemas/patientPortal/responses/ongoingCondition.schema';
import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): OngoingCondition[] => {
  const responseData = response as { data: unknown[] };
  if (!responseData.data) {
    return [];
  }

  return responseData.data.map(item => OngoingConditionSchema.parse(item));
};

export const useOngoingConditionsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, OngoingCondition[]>({
    queryKey: ['ongoingConditions', user?.id],
    queryFn: () => api.get('/me/ongoing-conditions'),
    enabled: !!user?.id,
    select: transformData,
  });
};
