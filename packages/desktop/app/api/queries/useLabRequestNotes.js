import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLabRequestNotes = labRequestId => {
  const api = useApi();

  return useQuery(['labRequest', labRequestId, 'notes'], () =>
    api.get(`labRequest/${encodeURIComponent(labRequestId)}/notes`),
  );
};
