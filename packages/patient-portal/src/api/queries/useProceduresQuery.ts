import { useQuery } from '@tanstack/react-query';
import {
  ProcedureSchema,
  type Procedure,
} from '@tamanu/shared/schemas/patientPortal/responses/procedure.schema';
import { useApi } from '../useApi';
import { transformArray } from '@utils/transformData';

export const useProceduresQuery = () => {
  const api = useApi();

  return useQuery<unknown, Error, Procedure[]>({
    queryKey: ['procedures'],
    queryFn: () => api.get('me/procedures'),
    select: transformArray<Procedure>(ProcedureSchema),
  });
};
