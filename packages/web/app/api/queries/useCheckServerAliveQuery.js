import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

// The ping carries the first-run setup flag and, while a facility is doing its first sync, which
// phase it is up to. Re-checking on an interval is what advances the initial sync progress screen and
// eventually offers the user a way in, without a reload and without a request of its own.
const POLL_INTERVAL_MS = 10_000;

export const useCheckServerAliveQuery = () => {
  const api = useApi();

  return useQuery(['serverAlive'], () => api.checkServerAlive(), {
    refetchInterval: POLL_INTERVAL_MS,
  });
};
