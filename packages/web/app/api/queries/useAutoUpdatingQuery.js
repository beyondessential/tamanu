import { useEffect, useMemo, useRef } from 'react';
import { debounce } from 'es-toolkit/compat';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSocket } from '../../utils/useSocket';
import { useApi } from '../useApi';

// Every client listening on a channel receives the same broadcast at the same instant, so
// a fixed debounce does not spread their refetches out — it lines them up, all firing
// exactly DEBOUNCE_MS later. On a busy deployment that is a synchronised stampede of
// identical queries. The jitter scatters each client across the window instead.
const INVALIDATE_DEBOUNCE_MS = 1000;
const INVALIDATE_JITTER_MS = 4000;

/**
 * Similar to useQuery but with a listener to a socket channel matching the endpoint that indicates
 * when the data has updated, and invalidates the query when the event is received
 */
export const useAutoUpdatingQuery = (
  endpoint,
  queryParams,
  updateDetectionChannels,
  fetchOptions,
) => {
  const api = useApi();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => [endpoint, queryParams], [endpoint, queryParams]);

  const channelList = Array.isArray(updateDetectionChannels)
    ? updateDetectionChannels
    : [updateDetectionChannels];
  const channelsKey = channelList.join(',');

  // Callers build both the channel list and queryParams inline, so their identities change
  // on every render. The socket effect must not turn over with them: re-running it would
  // build a fresh debouncer each render, and a debouncer that is replaced before its timer
  // elapses cannot collapse anything. Depend on the channel contents, and read the
  // invalidation target through a ref so the effect ignores queryKey identity entirely.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const channels = useMemo(() => channelList, [channelsKey]);
  const queryKeyRef = useRef(queryKey);
  queryKeyRef.current = queryKey;

  useEffect(() => {
    if (!socket) return;

    const handleDataUpdatedEvent = debounce(
      () => queryClient.invalidateQueries(queryKeyRef.current),
      INVALIDATE_DEBOUNCE_MS + Math.random() * INVALIDATE_JITTER_MS,
    );
    channels.forEach(channel => socket.on(channel, handleDataUpdatedEvent));

    return () => {
      handleDataUpdatedEvent.cancel();
      channels.forEach(channel => socket.off(channel, handleDataUpdatedEvent));
    };
  }, [socket, channels, queryClient]);

  return useQuery(queryKey, () => api.get(endpoint, queryParams), fetchOptions);
};
