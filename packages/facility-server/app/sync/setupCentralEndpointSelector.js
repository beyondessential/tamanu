import { FACT_CENTRAL_ENDPOINT_IN_USE } from '@tamanu/constants';
import { log } from '@tamanu/shared/services/logging';

import { getCentralHosts, getServerFacilityIds } from '../serverConfig';
import { CentralEndpointSelector, setCentralEndpointSelector } from './CentralEndpointSelector';
import { SyncLoginBackoff, setSyncLoginBackoff } from './SyncLoginBackoff';

const DEFAULT_RECHECK_INTERVAL_SECONDS = 300;
const DEFAULT_PROBE_TIMEOUT_SECONDS = 5;
const DEFAULT_REFUSED_INITIAL_PAUSE_SECONDS = 120;
const DEFAULT_REFUSED_MAX_PAUSE_SECONDS = 3600;

// How often a process that follows the sync process re-reads which endpoint it is using.
const FOLLOW_INTERVAL_MS = 15_000;

// spec: CEND
// Creates the process's selector from the recorded host list and makes connections use it. A
// server hosting several facilities takes these settings from the first, as the scheduled tasks do.
//
// `role` is what the process does with the selector:
// - 'owner': the sync process, which walks the list and rechecks earlier endpoints
// - 'follower': a process without a central connection of its own, which follows the owner
// - 'standalone': a one-off command, which can fail over but does not recheck
export async function setupCentralEndpointSelector(context, { role }) {
  const readSetting = async key => {
    const [facilityId] = getServerFacilityIds() ?? [];
    const reader = facilityId ? context.settings[facilityId] : context.settings.global;
    return reader.get(key);
  };

  const readProbeSettings = async () => {
    const recheckSeconds = await readSetting('sync.centralEndpointRecheckIntervalInSeconds');
    const timeoutSeconds = await readSetting('sync.centralEndpointProbeTimeoutInSeconds');
    return {
      recheckIntervalMs: (recheckSeconds ?? DEFAULT_RECHECK_INTERVAL_SECONDS) * 1000,
      probeTimeoutMs: (timeoutSeconds ?? DEFAULT_PROBE_TIMEOUT_SECONDS) * 1000,
    };
  };

  setSyncLoginBackoff(
    new SyncLoginBackoff({
      getSettings: async () => ({
        initialDelayMs:
          ((await readSetting('sync.syncLoginRefusedInitialPauseInSeconds')) ??
            DEFAULT_REFUSED_INITIAL_PAUSE_SECONDS) * 1000,
        maxDelayMs:
          ((await readSetting('sync.syncLoginRefusedMaxPauseInSeconds')) ??
            DEFAULT_REFUSED_MAX_PAUSE_SECONDS) * 1000,
      }),
    }),
  );

  const hosts = getCentralHosts();
  const selector = new CentralEndpointSelector({
    models: context.models,
    hosts,
    inUse: await context.models.LocalSystemFact.get(FACT_CENTRAL_ENDPOINT_IN_USE),
    getDeviceId: () => context.deviceId,
    getProbeSettings: readProbeSettings,
    canProbe: role !== 'follower',
  });
  setCentralEndpointSelector(selector);
  /* eslint-disable-next-line require-atomic-updates -- single-threaded boot, no concurrent writers */
  context.endpointSelector = selector;

  // Both are idle while the list has one entry or the first is in use, and the list can grow
  // while the process runs, so they start regardless.
  if (role === 'owner') {
    context.onClose(selector.startRechecking());
  } else if (role === 'follower') {
    context.onClose(selector.follow(FOLLOW_INTERVAL_MS));
  }

  log.info('Central endpoints', { hosts, inUse: selector.current(), role });
  return selector;
}
