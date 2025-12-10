import { useQuery } from '@tanstack/react-query';
import { type Procedure } from '@tamanu/shared/schemas/patientPortal/responses/procedure.schema';
import { useApi } from '../useApi';

export const useProceduresQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, Procedure[]>({
    queryKey: ['procedures'],
    queryFn: () => api.get('me/procedures'),
  });
};
