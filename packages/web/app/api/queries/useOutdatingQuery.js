import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../utils/useSocket';

/**
 * An extension of useQuery hook that adds a listener for a given event on the socket
 * and invalidates the query when the event is received
 */
export const useOutdatingQuery = (
  queryKey,
  eventName,
  queryFunc,
  { onOutdated, ...queryConfig } = {},
) => {
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleDataUpdatedEvent = msg => {
      queryClient.invalidateQueries(queryKey);
      if (!onOutdated) return;
      onOutdated(msg);
    };
    if (!socket) return;
    socket.on(eventName, handleDataUpdatedEvent);
    return () => socket.off(eventName, handleDataUpdatedEvent);
  }, [socket, onOutdated, eventName, queryClient, queryKey]);

  return useQuery(queryKey, queryFunc, queryConfig);
};
