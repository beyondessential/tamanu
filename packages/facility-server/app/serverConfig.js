import config from 'config';

import {
  FACT_CENTRAL_HOST,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
} from '@tamanu/constants';
import { parseSyncUrl } from '@tamanu/database/services/syncConnectionConfig';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

// Resolved once at boot by initServerConfig and read synchronously across the
// runtime — the same role config used to play, so consumers don't each re-read
// facts. Holds two distinct concerns:
//   - sync: where/how this server syncs (host + credentials)
//   - facilityIds: which facilities this server represents (its identity)
let resolved = null;

/**
 * Resolve this server's sync connection and facility identity.
 *
 * Each value resolves in priority order: env var > local system fact > legacy
 * config. This is a pure read-resolver — it writes nothing. Facts are written
 * out of band by the first-run setup wizard (and FACT_FACILITY_IDS by the
 * existing facility-match integrity check); config is the deprecated fallback.
 *
 * Mirrors initDeviceId: resolve once at boot, then expose via the getters below
 * (and on `context.serverConfig`) rather than having the runtime touch config.
 */
export async function initServerConfig({ context }) {
  const { LocalSystemFact } = context.store?.models ?? context.models;
  const env = parseEnv();

  const host = env.host ?? (await LocalSystemFact.get(FACT_CENTRAL_HOST)) ?? configHost();
  const email = env.email ?? (await LocalSystemFact.get(FACT_SYNC_EMAIL)) ?? configValue('email');
  const password =
    env.password ?? (await LocalSystemFact.get(FACT_SYNC_PASSWORD)) ?? configValue('password');

  const factFacilityIds = await LocalSystemFact.get(FACT_FACILITY_IDS);
  const facilityIds =
    env.facilityIds ?? (factFacilityIds ? JSON.parse(factFacilityIds) : null) ?? configFacilityIds();

  resolved = { sync: { host, email, password }, facilityIds };

  // The awaits above are settled, so the atomic-updates warning is a false positive.
  /* eslint-disable-next-line require-atomic-updates */
  context.serverConfig = resolved;

  return context;
}

// The sync connection: { host, email, password }.
export function getSyncConfig() {
  return current().sync;
}

// The facilities this server represents — identity used across settings, auth,
// sync and tasks, not just sync.
export function getServerFacilityIds() {
  return current().facilityIds;
}

// Whether the server is fully set up to sync: a sync connection plus at least
// one facility.
export function isServerConfigured() {
  const { sync, facilityIds } = current();
  return Boolean(sync.host && sync.email && sync.password && facilityIds?.length);
}

/**
 * The facility ids this server is externally *declared* to serve (env or config,
 * never the fact). The facility-match integrity check drift-checks this against
 * the recorded FACT_FACILITY_IDS; a wizard-configured server has no external
 * declaration, so it returns null and the check is skipped.
 */
export function getDeclaredFacilityIds() {
  return parseEnv().facilityIds ?? configFacilityIds();
}

// Resolved holder if boot has run, else an env+config view (e.g. tests, or an
// entry point that didn't build a full context) so behaviour is never worse
// than the pre-facts config-only path.
function current() {
  if (resolved) return resolved;
  const env = parseEnv();
  return {
    sync: {
      host: env.host ?? configHost(),
      email: env.email ?? configValue('email'),
      password: env.password ?? configValue('password'),
    },
    facilityIds: env.facilityIds ?? configFacilityIds(),
  };
}

function parseEnv() {
  const result = { host: null, email: null, password: null, facilityIds: null };
  if (process.env.SYNC_URL) {
    const { host, email, password } = parseSyncUrl(process.env.SYNC_URL);
    result.host = host;
    result.email = email ?? null;
    result.password = password ?? null;
  }
  if (process.env.SYNC_FACILITY_IDS) {
    result.facilityIds = process.env.SYNC_FACILITY_IDS.split(',')
      .map(id => id.trim())
      .filter(Boolean);
  }
  return result;
}

function configHost() {
  return config.sync?.host ? new URL(config.sync.host.trim()).origin : null;
}

function configValue(key) {
  return config.sync?.[key] || null;
}

function configFacilityIds() {
  return selectFacilityIds(config) ?? null;
}
