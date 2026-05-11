import { RandomEntityFetcher } from '@tamanu/fake-data/services/RandomEntityFetcher';

import { TamanuApi } from '@tamanu/api-client';
import { version } from '../../package.json';

/**
 * Bounded pool of device ids: at most `SYNTHETIC_DEVICE_POOL_SIZE` logins run at once **per
 * Artillery worker thread** during a fresh login; others wait for a slot before `TamanuApi` is
 * constructed.
 *
 * **Artillery parallelism (local):** the platform splits work across about `max(1, cpuCount - 1)`
 * worker threads (`node_modules/artillery/lib/platform/local/index.js`). Each thread loads this
 * processor module in isolation, so **session reuse below is per worker thread**, not global
 * across the whole test run. You still get far fewer logins when many scenarios run on the same
 * thread. To force a single thread (one shared cache), use `artillery run --solo` (note: `--solo`
 * also replaces phases with a single-VU plan — adjust phases/overrides if you need full load with
 * one thread).
 *
 * @see packages/database Device.ensureRegistration (per-user advisory lock) for concurrent login safety.
 */
const SYNTHETIC_DEVICE_POOL_SIZE = 32;

const SYNTHETIC_DEVICE_IDS = Array.from(
  { length: SYNTHETIC_DEVICE_POOL_SIZE },
  (_, i) => `synthetic-tests-artillery-pool-${i}`,
);

const availableSyntheticDeviceIds: string[] = [...SYNTHETIC_DEVICE_IDS];
const syntheticDeviceIdWaiters: Array<(id: string) => void> = [];

function acquireSyntheticDeviceId(): Promise<string> {
  return new Promise(resolve => {
    const id = availableSyntheticDeviceIds.pop();
    if (id !== undefined) {
      resolve(id);
    } else {
      syntheticDeviceIdWaiters.push(resolve);
    }
  });
}

function releaseSyntheticDeviceId(id: string): void {
  const waiter = syntheticDeviceIdWaiters.shift();
  if (waiter) {
    waiter(id);
  } else {
    availableSyntheticDeviceIds.push(id);
  }
}

type CachedSession = {
  target: string;
  email: string;
  deviceId: string;
  token: string;
  userId: string;
  facilityId: string;
  availableFacilities: unknown;
  expiresAtMs: number;
};

/** Per worker thread (Artillery loads one processor instance per thread). */
let sessionCache: CachedSession | null = null;
let loginInProgress: Promise<void> | null = null;

/** When the facility JWT has no `exp` claim, assume this TTL from login time. */
const FALLBACK_SESSION_TTL_MS = 50 * 60 * 1000;

function getJwtExpiryMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) {
      return null;
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    if (typeof payload.exp !== 'number') {
      return null;
    }
    return payload.exp * 1000;
  } catch {
    return null;
  }
}

function isSessionValid(session: CachedSession, target: string, email: string, skewMs: number): boolean {
  if (session.target !== target || session.email !== email) {
    return false;
  }
  return session.expiresAtMs > Date.now() + skewMs;
}

async function resolveToken(
  api: TamanuApi,
  loginToken: string,
  facilityId: string,
): Promise<string> {
  const setFacilityResponse = await api.post('setFacility', { facilityId });
  if (setFacilityResponse?.token) {
    api.setToken(setFacilityResponse.token);
    return setFacilityResponse.token;
  }
  return loginToken;
}

/**
 * Login + setFacility; returns session material for reuse. Does not read/write sessionCache.
 */
async function performFullLogin(
  context: any,
  email: string,
  password: string,
): Promise<CachedSession> {
  const target = context.vars.target as string;
  const deviceId = await acquireSyntheticDeviceId();
  let api: TamanuApi;
  let loginResponse: any;
  try {
    api = new TamanuApi({
      endpoint: `${target}/api`,
      agentName: 'Tamanu Desktop',
      agentVersion: version,
      deviceId,
      logger: console,
    });
    loginResponse = await api.login(email, password);
  } finally {
    releaseSyntheticDeviceId(deviceId);
  }

  const { user, availableFacilities } = loginResponse;
  const facilityId = availableFacilities?.[0]?.id;
  if (!facilityId) {
    throw new Error('No available facilities — cannot run synthetic tests without a facility');
  }

  const token = await resolveToken(api, loginResponse.token, facilityId);
  const jwtExp = getJwtExpiryMs(token);
  const expiresAtMs = jwtExp ?? Date.now() + FALLBACK_SESSION_TTL_MS;

  return {
    target,
    email,
    deviceId,
    token,
    userId: user.id,
    facilityId,
    availableFacilities,
    expiresAtMs,
  };
}

function applySessionToContext(context: any, session: CachedSession): void {
  const api = new TamanuApi({
    endpoint: `${session.target}/api`,
    agentName: 'Tamanu Desktop',
    agentVersion: version,
    deviceId: session.deviceId,
    logger: console,
  });
  api.setToken(session.token);

  context.vars = {
    ...context.vars,
    api,
    entityFetcher: new RandomEntityFetcher(api),
    token: session.token,
    userId: session.userId,
    facilityId: session.facilityId,
    availableFacilities: session.availableFacilities,
  };
}

const EXPIRY_SKEW_MS = 60_000;

async function getOrCreateSharedSession(context: any, email: string, password: string): Promise<void> {
  const target = context.vars.target as string;

  if (sessionCache && isSessionValid(sessionCache, target, email, EXPIRY_SKEW_MS)) {
    return;
  }

  if (!loginInProgress) {
    loginInProgress = (async () => {
      const session = await performFullLogin(context, email, password);
      sessionCache = session;
    })().finally(() => {
      loginInProgress = null;
    });
  }

  await loginInProgress;

  if (!sessionCache || !isSessionValid(sessionCache, target, email, EXPIRY_SKEW_MS)) {
    throw new Error('Auth session missing or expired immediately after login');
  }
}

/**
 * Authenticates the user and stores the token, facility ID, and user ID in context.vars.
 *
 * Repeated `authenticate` calls on the same Artillery worker thread reuse the JWT until just
 * before `exp` (or `FALLBACK_SESSION_TTL_MS` after login if the token has no `exp`).
 * Each scenario still invokes this hook; reuse avoids hitting `/login` every time. New logins are
 * serialized on a thread so concurrent scenarios share one refresh.
 */
export async function authenticate(context: any, _events: any): Promise<void> {
  const email = context.vars.email ?? 'admin@tamanu.io';
  const password = context.vars.password ?? 'admin';

  await getOrCreateSharedSession(context, email, password);
  if (!sessionCache) {
    throw new Error('Auth session missing after login');
  }
  applySessionToContext(context, sessionCache);
}
