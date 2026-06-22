import config from 'config';

import {
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
} from '@tamanu/constants';
import { parseSyncUrl } from '@tamanu/database/services/syncConnectionConfig';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { log } from '@tamanu/shared/services/logging';

/**
 * Resolve where this facility server syncs to and which facilities it serves.
 *
 * Local system facts are the source of truth. They get populated, in priority
 * order, by:
 *   1. the `SYNC_URL` / `SYNC_FACILITY_IDS` env vars (declarative — for k8, applied every boot)
 *   2. the first-run setup wizard (writes the same facts out of band)
 *   3. legacy `sync.*` / `serverFacilityId(s)` config (back-compat, seeded once)
 *
 * Mirrors initDeviceId: resolve once at boot, hang the result off `context`, and
 * let the runtime read that rather than touching config directly.
 *
 * The config back-compat seeding is a one-version shim; remove it with the
 * `sync.host`/`email`/`password` + `serverFacilityId(s)` config keys later.
 */
export async function initSyncConfig({ context }) {
  const { LocalSystemFact } = context.store?.models ?? context.models;

  await applyEnv(LocalSystemFact);
  await seedFromLegacyConfig(LocalSystemFact);

  const host = await LocalSystemFact.get(FACT_CENTRAL_HOST);
  const email = await LocalSystemFact.get(FACT_SYNC_EMAIL);
  const password = await LocalSystemFact.get(FACT_SYNC_PASSWORD);
  const facilityIdsValue = await LocalSystemFact.get(FACT_FACILITY_IDS);
  const facilityIds = facilityIdsValue ? JSON.parse(facilityIdsValue) : null;

  // Resolved once at boot, like initDeviceId; the awaits above are settled before
  // these assignments, so the atomic-updates warning is a false positive here.
  /* eslint-disable require-atomic-updates */
  context.syncHost = host;
  context.syncCredentials = host ? { email, password } : null;
  context.facilityIds = facilityIds;
  context.isConfigured = Boolean(host && email && password && facilityIds?.length);
  /* eslint-enable require-atomic-updates */

  return context;
}

async function applyEnv(LocalSystemFact) {
  if (process.env.SYNC_URL) {
    const { host, email, password } = parseSyncUrl(process.env.SYNC_URL);
    await LocalSystemFact.set(FACT_CENTRAL_HOST, host);
    if (email) await LocalSystemFact.set(FACT_SYNC_EMAIL, email);
    if (password) await LocalSystemFact.set(FACT_SYNC_PASSWORD, password);
  }

  if (process.env.SYNC_FACILITY_IDS) {
    const ids = process.env.SYNC_FACILITY_IDS.split(',')
      .map(id => id.trim())
      .filter(Boolean);
    await LocalSystemFact.set(FACT_FACILITY_IDS, JSON.stringify(ids));
  }
}

async function seedFromLegacyConfig(LocalSystemFact) {
  if (!(await LocalSystemFact.get(FACT_CENTRAL_HOST)) && config.sync?.host) {
    await LocalSystemFact.set(FACT_CENTRAL_HOST, new URL(config.sync.host.trim()).origin);
    if (config.sync.email) await LocalSystemFact.set(FACT_SYNC_EMAIL, config.sync.email);
    if (config.sync.password) await LocalSystemFact.set(FACT_SYNC_PASSWORD, config.sync.password);
    log.warn(
      'sync.host/email/password config is deprecated and was seeded into local system facts; ' +
        'use SYNC_URL or the setup wizard instead.',
    );
  }

  if (!(await LocalSystemFact.get(FACT_FACILITY_IDS))) {
    const legacyIds = selectFacilityIds(config);
    if (legacyIds?.length) {
      await LocalSystemFact.set(FACT_FACILITY_IDS, JSON.stringify(legacyIds));
      log.warn(
        'serverFacilityId(s) config is deprecated and was seeded into local system facts; ' +
          'use SYNC_FACILITY_IDS or the setup wizard instead.',
      );
    }
  }
}
