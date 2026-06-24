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

// { sync: { host, email, password }, facilityIds }, resolved once at boot.
let resolved = null;

/**
 * Resolve this server's sync connection and facility identity once at boot, each
 * value in priority order: env var > local system fact > legacy config. Pure
 * read — facts are written elsewhere (the setup wizard, and FACT_FACILITY_IDS by
 * the facility-match integrity check).
 */
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
    log.warn(`initServerConfig: could not read local system facts (${error.message}); using env/config`);
  }

  let password = null;
  try {
    password = await LocalSystemSecret.getSecret(FACT_SYNC_PASSWORD);
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

// The host/facility ids this server is externally *declared* to use (env or
// config, never the fact) — the integrity checks drift-check these against the
// recorded facts, and skip when null (a wizard-configured server has no
// declaration).
export function getDeclaredFacilityIds() {
  return parseEnv().facilityIds ?? configFacilityIds();
}

export function getDeclaredHost() {
  return parseEnv().host ?? configHost();
}

// Resolved holder once boot has run, else an env+config view (tests, or an entry
// point without a full context).
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
