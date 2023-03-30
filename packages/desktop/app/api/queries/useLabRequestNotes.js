import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useLabRequestNotes = labRequestId => {
  const api = useApi();

  return useQuery(['labRequest', labRequestId, 'notePages'], () =>
    api.get(`labRequest/${encodeURIComponent(labRequestId)}/notePages`),
  );
};
