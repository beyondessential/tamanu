import { ReadSettings } from '@tamanu/settings/reader';
import { log } from '@tamanu/shared/services/logging';
import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';

import { initTimesync } from './services/initTimesync';
import { CentralServerConnection, FacilitySyncManager } from './sync';
import {
  getServerFacilityIds,
  getSyncConfig,
  isServerConfigured,
  initServerConfig,
} from './serverConfig';
import { resolveSchedules } from './tasks';

// How often a sync/tasks process re-checks for first-run setup completing.
const SETUP_POLL_INTERVAL_MS = 30_000;

export const SYNC_NOT_CONFIGURED_WARNING =
  'Facility server has no sync host/facilities configured; sync is disabled until setup ' +
  'is completed (SYNC_URL / TAMANU_FACILITY_IDS env or the setup wizard).';

// Wire up the sync runtime when configured, else warn and leave it disabled (a
// fresh server still boots to serve the wizard). Returns whether it was set up.
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
    enabled: (await resolveSchedules(context)).timeSync.enabled,
  });
  context.centralServer = new CentralServerConnection(context);
  context.syncManager = syncManager ?? new FacilitySyncManager(context);

  await performTimeZoneChecks({ sequelize: context.sequelize });

  return true;
}

// The wizard request may be handled by a different process to this one, so keep checking whether
// the server has been configured and wire this process up when it has.
// `setup` does the wiring: the sync runtime by default, and the API process passes its own.
export function startSyncRuntimeWhenConfigured(
  context,
  { intervalMs = SETUP_POLL_INTERVAL_MS, setup = setupSyncRuntime } = {},
) {
  let starting = false;
  const timer = setInterval(async () => {
    if (starting) return; // a previous tick is still wiring things up
    starting = true;
    try {
      await initServerConfig({ context }); // re-read facts written by the wizard
      if (!isServerConfigured()) return;
      // context.settings is keyed by the facilities known at boot, which is none here.
      for (const facilityId of getServerFacilityIds()) {
        context.settings[facilityId] ??= new ReadSettings(context.models, facilityId);
      }
      // Only stop polling after setup has worked. If it throws (e.g. central can't be reached) we
      // try again on the next tick.
      await setup(context);
      clearInterval(timer);
      log.info('Setup completed; runtime started');
    } catch (error) {
      log.warn(`startSyncRuntimeWhenConfigured: ${error.message}`);
    } finally {
      /* eslint-disable-next-line require-atomic-updates -- single-threaded poll; the flag just stops overlapping ticks */
      starting = false;
    }
  }, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
}
