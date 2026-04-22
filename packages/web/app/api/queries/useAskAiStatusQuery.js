import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useAskAiStatusQuery = ({ enabled }) => {
  const api = useApi();

  return useQuery(['askAiStatus'], () => api.get('ask-ai/status'), {
    enabled,
    // Status is stable for the lifetime of the session — no need to refetch
    staleTime: Infinity,
  });
};
