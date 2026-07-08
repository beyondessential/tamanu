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

// Cached holder. initServerConfig re-runs refresh it (so isServerConfigured()
// flips in-process), but the sync runtime is not hot-reloaded — values captured at
// construction (e.g. CentralServerConnection's host) need a restart to update.
let resolved = null;

// Resolve sync host/credentials + facility ids once at boot: env > fact > config.
// Pure read; facts are written by the wizard and the facility-match integrity check.
export async function initServerConfig({ context }) {
  const models = context.store?.models ?? context.models;
  const env = parseEnv();
  const facts = await readFacts(models);

  const host = env.host ?? facts.host ?? configHost();
  const email = env.email ?? facts.email ?? configValue('email');
  const password = env.password ?? facts.password ?? configValue('password');
  const facilityIds = env.facilityIds ?? facts.facilityIds ?? configFacilityIds();

  resolved = { sync: { host, email, password }, facilityIds };

  /* eslint-disable-next-line require-atomic-updates -- awaits above are settled */
  context.serverConfig = resolved;

  return context;
}

// Tolerant of the tables not existing yet (init runs before migrations on a fresh
// DB) and of a missing key file — the password is read separately so a key-file
// failure doesn't blank out the non-secret facts.
async function readFacts({ LocalSystemFact, LocalSystemSecret }) {
  let host = null;
  let email = null;
  let facilityIds = null;
  try {
    const facilityIdsValue = await LocalSystemFact.get(FACT_FACILITY_IDS);
    host = await LocalSystemFact.get(FACT_CENTRAL_HOST);
    email = await LocalSystemFact.get(FACT_SYNC_EMAIL);
    facilityIds = facilityIdsValue ? JSON.parse(facilityIdsValue) : null;
  } catch (error) {
    log.warn(
      `initServerConfig: could not read local system facts (${error.message}); using env/config`,
    );
  }

  let password = null;
  try {
    password = await LocalSystemSecret.get(FACT_SYNC_PASSWORD);
  } catch (error) {
    log.warn(`initServerConfig: could not read sync password secret (${error.message})`);
  }

  return { host, email, password, facilityIds };
}

export function getSyncConfig() {
  return current().sync;
}

export function getServerFacilityIds() {
  return current().facilityIds;
}

export function isServerConfigured() {
  const { sync, facilityIds } = current();
  return Boolean(sync.host && sync.email && sync.password && facilityIds?.length);
}

// What the server is *declared* to use (env/config, never the fact). Integrity
// checks drift-check these against the recorded facts, and skip when null.
export function getDeclaredFacilityIds() {
  return parseEnv().facilityIds ?? configFacilityIds();
}

export function getDeclaredHost() {
  return parseEnv().host ?? configHost();
}

// The cached holder, or an env+config view before boot (tests / no-context callers).
function current() {
  if (resolved) return resolved;
  const env = parseEnv();
  return {
    sync: {
      host: getDeclaredHost(),
      email: env.email ?? configValue('email'),
      password: env.password ?? configValue('password'),
    },
    facilityIds: getDeclaredFacilityIds(),
  };
}

function parseEnv() {
  const result = { host: null, email: null, password: null, facilityIds: null };
  if (process.env.SYNC_URL) {
    let parsed;
    try {
      parsed = parseSyncUrl(process.env.SYNC_URL);
    } catch {
      throw new Error(
        'SYNC_URL is not a valid URL (expected e.g. https://user:password@central.example.com)',
      );
    }
    result.host = parsed.host;
    result.email = parsed.email ?? null;
    result.password = parsed.password ?? null;
  }
  if (process.env.SYNC_FACILITY_IDS) {
    result.facilityIds = [
      ...new Set(
        process.env.SYNC_FACILITY_IDS.split(',')
          .map(id => id.trim())
          .filter(Boolean),
      ),
    ];
  }
  return result;
}

function configHost() {
  if (!config.sync?.host) return null;
  try {
    return new URL(config.sync.host.trim()).origin;
  } catch {
    // A malformed legacy sync.host shouldn't crash startup; treat as unset.
    log.warn(`Ignoring invalid sync.host config value: ${config.sync.host}`);
    return null;
  }
}

function configValue(key) {
  return config.sync?.[key] ?? null;
}

function configFacilityIds() {
  return selectFacilityIds(config) ?? null;
}
