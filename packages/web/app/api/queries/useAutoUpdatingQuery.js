import { useEffect, useMemo } from 'react';
import { debounce } from 'lodash';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../utils/useSocket';
import { useApi } from '../useApi';

/**
 * Similar to useQuery but with a listener to a socket channel matching the endpoint that indicates
 * when the data has updated, and invalidates the query when the event is received
 */
export const useAutoUpdatingQuery = (endpoint, queryParams, updateDetectionChannel) => {
  const api = useApi();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => [endpoint, queryParams], [endpoint, queryParams]);

  useEffect(() => {
    const handleDataUpdatedEvent = debounce(() => {
      queryClient.invalidateQueries(queryKey);
    }, 1000);
    if (!socket) return;
    socket.on(updateDetectionChannel, handleDataUpdatedEvent);
    return () => socket.off(updateDetectionChannel, handleDataUpdatedEvent);
  }, [socket, updateDetectionChannel, queryClient, queryKey]);

  return useQuery(queryKey, () => api.get(endpoint, queryParams));
};
