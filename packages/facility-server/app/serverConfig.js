import config from 'config';

import {
  FACT_CENTRAL_HOST,
  FACT_LAST_SUCCESSFUL_SYNC_PULL,
  FACT_SYNC_EMAIL,
  FACT_SYNC_PASSWORD,
  FACT_FACILITY_IDS,
} from '@tamanu/constants';
import { parseSyncUrl } from '@tamanu/database/services/syncConnectionConfig';
import { facilityIdsFromEnv, selectFacilityIds } from '@tamanu/utils/selectFacilityIds';
import { log } from '@tamanu/shared/services/logging';

// Cached holder. initServerConfig re-runs refresh it (so isServerConfigured()
// flips in-process), but the sync runtime is not hot-reloaded — values captured at
// construction (e.g. CentralServerConnection's host) need a restart to update.
let resolved = null;

// postgres undefined_table: the secret tables' migrations haven't run yet.
const UNDEFINED_TABLE = '42P01';

// Resolve sync host/credentials + facility ids once at boot: env > fact > config.
// Pure read; facts are written by the wizard and the facility-match integrity check.
export async function initServerConfig({ context }) {
  const models = context.store?.models ?? context.models;
  const env = parseEnv();
  const facts = await readFacts(models);

  const host = env.host ?? facts.host ?? configHost();
  const email = env.email ?? facts.email ?? configValue('email');
  const configPassword = facts.passwordUnreadable ? null : configValue('password');
  const password = env.password ?? facts.password ?? configPassword;
  const facilityIds = env.facilityIds ?? facts.facilityIds ?? configFacilityIds();

  resolved = { sync: { host, email, password }, facilityIds };

  // TAM-6962: the config leg goes away next release. Name the keys still coming from
  // it so we can find these servers first. This is a normal resting state, not an
  // error — provisionSyncUser is failure-tolerant and leaves a server on config when
  // central was unreachable during an upgrade.
  const fromConfig = ['host', 'email', 'password'].filter(
    key => env[key] == null && facts[key] == null && resolved.sync[key] != null,
  );
  if (env.facilityIds == null && facts.facilityIds == null && facilityIds != null) {
    fromConfig.push('facilityIds');
  }
  if (fromConfig.length > 0) {
    log.warn('serverConfig: sync settings resolved from legacy config', { keys: fromConfig });
  }

  /* eslint-disable-next-line require-atomic-updates -- awaits above are settled */
  context.serverConfig = resolved;

  return context;
}

// Tolerant of the tables not existing yet (init runs before migrations on a fresh
// DB). The password is read separately so a key-file failure doesn't blank out the
// non-secret facts.
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
  // A stored password that won't decrypt (the key file is missing, or belongs to another
  // deployment) must not fall through to the config value: retrying a stale credential
  // locks the sync user out on central.
  let passwordUnreadable = false;
  try {
    password = await LocalSystemSecret.get(FACT_SYNC_PASSWORD);
  } catch (error) {
    passwordUnreadable = error.original?.code !== UNDEFINED_TABLE;
    const message = `initServerConfig: could not read sync password secret (${error.message})`;
    if (passwordUnreadable) log.error(message);
    else log.warn(message);
  }

  return { host, email, password, passwordUnreadable, facilityIds };
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

// spec: FSETUP#setting-up-state
// Configured, but its first sync hasn't completed. Read on the liveness check, which otherwise
// answers without the database: a first sync that has completed stays completed, so once seen it
// isn't read again, and a database that can't be reached reports not setting up rather than
// failing the check. A server with sync turned off never completes a first sync, so it's never
// setting up.
let hasCompletedFirstSync = false;
export async function isSettingUp(models) {
  if (hasCompletedFirstSync || !config.sync.enabled || !isServerConfigured()) return false;
  try {
    const pullCursor = await models.LocalSystemFact.get(FACT_LAST_SUCCESSFUL_SYNC_PULL);
    if (!pullCursor) return true;
    // only ever goes from false to true, so a concurrent check can't undo it
    hasCompletedFirstSync = true; // eslint-disable-line require-atomic-updates
    return false;
  } catch (error) {
    log.warn('isSettingUp.failed', { error: error.message });
    return false;
  }
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
  result.facilityIds = facilityIdsFromEnv() ?? null;
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
