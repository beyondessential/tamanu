import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';
import {
  getBrowserDescriptor,
  readCachedDecision,
  staticDecision,
  writeCachedDecision,
} from '../../utils/browserSupport';

// Resolves the dynamic browser/device support gate against the public endpoint,
// falling back to the static build-time check on any error or timeout. Returns
// 'loading' until decided; a cached "allowed" decision (seeded as initialData)
// resolves immediately with no loading flash.
export const useBrowserSupport = ({ enabled = true } = {}) => {
  const api = useApi();
  const descriptor = getBrowserDescriptor();

  const { data, isLoading } = useQuery(
    ['browserSupport'],
    async () => {
      const cached = readCachedDecision();
      if (cached) return cached;
      try {
        const decision = await api.post('public/browser-support', descriptor, {
          useAuthToken: false,
          waitForAuth: false,
          showUnknownErrorToast: false,
          timeout: 2000,
        });
        writeCachedDecision(decision);
        return decision;
      } catch {
        return staticDecision(descriptor);
      }
    },
    {
      enabled,
      staleTime: Infinity,
      initialData: () => readCachedDecision() ?? undefined,
    },
  );

  if (!enabled) return { status: 'allowed', descriptor };
  if (isLoading || !data) return { status: 'loading', descriptor };
  return {
    status: data.allowed ? 'allowed' : 'unsupported',
    reason: data.reason,
    descriptor,
  };
};
