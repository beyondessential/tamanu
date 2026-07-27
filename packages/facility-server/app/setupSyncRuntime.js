import { log } from '@tamanu/shared/services/logging';
import { performTimeZoneChecks } from '@tamanu/shared/utils/timeZoneCheck';

import { initTimesync } from './services/initTimesync';
import { CentralServerConnection, FacilitySyncManager } from './sync';
import { getSyncConfig, isServerConfigured, initServerConfig } from './serverConfig';
import { resolveSchedules } from './tasks';

// How often a sync/tasks process re-checks for first-run setup completing.
const SETUP_POLL_INTERVAL_MS = 30_000;

export const SYNC_NOT_CONFIGURED_WARNING =
  'Facility server has no sync host/facilities configured; sync is disabled until setup ' +
  'is completed (SYNC_URL / SYNC_FACILITY_IDS env or the setup wizard).';

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

// The wizard configures the server in the API process; poll so every process
// (or a process other than the one that served the wizard) re-reads the new
// config and wires up its runtime without a restart. Only start this when booted
// unconfigured. `setup` is what to wire once configured — defaults to the full
// sync runtime; the API process passes its own lighter routine.
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
      // Only stop polling once the runtime is up — if setup throws (e.g. central
      // briefly unreachable) we retry on the next tick rather than disabling sync.
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
