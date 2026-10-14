import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const timeZoneQueryOptions = (api: ReturnType<typeof useApi>) => ({
  queryKey: ['timeZone'],
  queryFn: () => api.get('time-zone'),
  staleTime: Infinity,
});

/** The time zone dates and times are stored in, as staff's are. */
export const useTimeZoneQuery = () => {
  const api = useApi();
  return useQuery<unknown, Error, { primaryTimeZone: string }>(timeZoneQueryOptions(api));
};
