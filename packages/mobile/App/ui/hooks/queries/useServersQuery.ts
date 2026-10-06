import { useQuery, type UseQueryOptions, type UseQueryResult } from '@tanstack/react-query';

import type { SelectOption } from '~/ui/components/Dropdown';
import { serverKeys } from './queryKeys';
import * as overrides from '/root/serverOverrides.json';

const DEFAULT_META_SERVER = 'https://meta.tamanu.app';

interface Server {
  name: string;
  type: string;
  host: string;
}

const fetchServers = async (): Promise<SelectOption[]> => {
  // To use a local server, just edit this and select it.
  // The central server config is sticky, so you can safely revert it after
  // the first sync begins and it'll stay connecting to your local server.
  // return [{ label: 'Local', value: 'http://192.168.0.1:3000' }];

  // allows overriding the central server list or meta server in builds
  const { metaServer: metaServerOverride, centralServers: centralServerOverrides } = overrides;
  if (centralServerOverrides) {
    return centralServerOverrides;
  }

  const metaServer = metaServerOverride || DEFAULT_META_SERVER;
  const response = await fetch(`${metaServer}/servers`);
  if (!response.ok) {
    throw new Error(`Could not fetch the server list from ${metaServer}: ${response.status}`);
  }
  const servers: Server[] = await response.json();

  const options = servers.map(s => ({
    label: s.name,
    value: s.host,
  }));

  if (__DEV__) {
    // If dev mode, add a local server option using special alias to localhost
    options.unshift({
      label: 'Local central server (port 3000)',
      value: 'http://10.0.2.2:3000',
    });
  }

  return options;
};

export default function useServersQuery(
  useQueryOptions: Omit<UseQueryOptions<SelectOption[]>, 'queryKey' | 'queryFn'> = {},
): UseQueryResult<SelectOption[]> {
  const { enabled = true, ...rest } = useQueryOptions;
  return useQuery({
    queryKey: serverKeys.list(),
    queryFn: fetchServers,
    staleTime: 60_000,
    /** Unlike local database queries, remote queries are worth retrying */
    retry: 2,
    refetchOnReconnect: true,
    enabled,
    ...rest,
  });
}
