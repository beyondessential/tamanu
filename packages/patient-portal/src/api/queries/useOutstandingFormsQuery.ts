import { useQuery } from '@tanstack/react-query';
import {
  OutstandingFormArraySchema,
  type OutstandingForm,
} from '@tamanu/shared/dtos/responses/OutstandingFormSchema';
import { PaginatedResponseSchema } from '@tamanu/shared/dtos/responses/CommonResponseSchemas';

import { useApi } from '../useApi';
import { useAuth } from '@auth/useAuth';

const transformData = (response: unknown): OutstandingForm[] => {
  const parsedResponse = PaginatedResponseSchema.parse(response);
  if (!parsedResponse.data) {
    return [];
  }

  return OutstandingFormArraySchema.parse(parsedResponse.data);
};

export const useOutstandingFormsQuery = () => {
  const api = useApi();
  const { user } = useAuth();

  return useQuery<unknown, Error, OutstandingForm[]>({
    queryKey: ['outstandingForms', user?.id],
    queryFn: () => api.get('/patient/me/outstanding-forms'),
    enabled: !!user?.id,
    select: transformData,
  });
};
