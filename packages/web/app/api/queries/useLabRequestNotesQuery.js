import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLabRequestNotesQuery = (labRequestId) => {
  const api = useApi();

  return useQuery(['labRequest', labRequestId, 'notes'], () =>
    api.get(`labRequest/${encodeURIComponent(labRequestId)}/notes`),
  );
};
