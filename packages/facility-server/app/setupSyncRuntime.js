import config from 'config';

import { log } from '@tamanu/shared/services/logging';
import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';

import { initTimesync } from './services/initTimesync';
import { CentralServerConnection, FacilitySyncManager } from './sync';
import { getSyncConfig, isServerConfigured } from './serverConfig';

export const SYNC_NOT_CONFIGURED_WARNING =
  'Facility server has no sync host/facilities configured; sync is disabled until setup ' +
  'is completed (SYNC_URL / SYNC_FACILITY_IDS env or the setup wizard).';

// Wire up the sync runtime (timesync, central connection, sync manager, timezone
// checks) when the server is configured; otherwise warn and leave it disabled so
// a fresh server still boots to serve the setup wizard. Returns whether sync was
// set up. `syncManager` lets callers inject one (tests).
export async function setupSyncRuntime(context, { syncManager } = {}) {
  if (!isServerConfigured()) {
    log.warn(SYNC_NOT_CONFIGURED_WARNING);
    return false;
  }

  const { host } = getSyncConfig();
  /* eslint-disable-next-line require-atomic-updates -- single-threaded boot, no concurrent writers */
  context.timesync = await initTimesync({
    models: context.models,
    url: `${host.replace(/\/*$/, '')}/api/timesync`,
  });
  context.centralServer = new CentralServerConnection(context);
  context.syncManager = syncManager ?? new FacilitySyncManager(context);

  await performTimeZoneChecks({
    remote: context.centralServer,
    sequelize: context.sequelize,
    config,
  });

  return true;
}
