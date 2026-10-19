import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import { route } from '@tamanu/api-client';

export const useLabRequestNotesQuery = labRequestId => {
  const api = useApi();

  return useQuery(['labRequest', labRequestId, 'notes'], () =>
    api.get(route('labRequest/:labRequestId/notes', { labRequestId })),
  );
};
