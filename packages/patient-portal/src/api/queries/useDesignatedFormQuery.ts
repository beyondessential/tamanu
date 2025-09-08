import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import {
  DesignatedFormSchema,
  type DesignatedForm,
} from '@tamanu/shared/schemas/patientPortal/responses/designatedForm.schema';

export const useDesignatedFormQuery = (designationId: string) => {
  const api = useApi();
  return useQuery<unknown, Error, DesignatedForm>({
    queryKey: ['designatedForm', designationId],
    queryFn: () => api.get(`/me/forms/${designationId}`),
    select: data => DesignatedFormSchema.parse(data),
    enabled: Boolean(designationId),
  });
};
