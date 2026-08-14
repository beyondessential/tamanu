import { QueryClient } from '@tanstack/react-query';

/**
 * Query and mutation functions read and write the local SQLite database rather than the
 * network, so:
 *
 * - networkMode 'always': the default 'online' mode pauses fetches while the device is
 *   offline, but offline is this app's normal operating state and local reads/writes
 *   don't care about connectivity.
 * - staleTime Infinity: the database only changes through sync and through local writes,
 *   both of which explicitly invalidate queries (see the sync invalidation bridge in
 *   BackendContext and the useMutation onSuccess handlers). There is no point refetching
 *   on remount or focus in between.
 * - retry false: a failed local read is a bug, not a transient condition.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'always',
      retry: false,
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
    mutations: {
      networkMode: 'always',
      retry: false,
    },
  },
});
