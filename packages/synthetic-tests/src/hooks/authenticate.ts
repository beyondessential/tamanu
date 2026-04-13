import { RandomEntityFetcher } from '@tamanu/fake-data/services/RandomEntityFetcher';

import { TamanuApi } from '@tamanu/api-client';
import { version } from '../../package.json';

/**
 * Bounded pool of device ids: at most `SYNTHETIC_DEVICE_POOL_SIZE` logins run at once **per
 * Artillery worker process**; others wait for a slot before `TamanuApi` is constructed. The id
 * is returned to the pool after `login` finishes (success or failure).
 *
 * Note: Artillery spawns one Node.js process per worker, so this pool is not shared across
 * workers. Under a multi-worker run, total concurrent logins can reach
 * `SYNTHETIC_DEVICE_POOL_SIZE × workerCount`. The advisory lock in `Device.ensureRegistration`
 * still prevents DB-level races regardless of worker count.
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
 * Authenticates the user and stores the token, facility ID, and user ID in context.vars.
 */
export async function authenticate(context: any, _events: any): Promise<void> {
  const { email = 'admin@tamanu.io', password = 'admin' } = context.vars;

  const deviceId = await acquireSyntheticDeviceId();
  let api: TamanuApi;
  let loginResponse: any;
  try {
    api = new TamanuApi({
      endpoint: `${context.vars.target}/api`,
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

  context.vars = {
    ...context.vars,
    api,
    entityFetcher: new RandomEntityFetcher(api),
    token,
    userId: user.id,
    facilityId,
    availableFacilities,
  };
}
