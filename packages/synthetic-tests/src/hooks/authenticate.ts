import { RandomEntityFetcher } from '@tamanu/fake-data/services/RandomEntityFetcher';

import { TamanuApi } from '@tamanu/api-client';
import { version } from '../../package.json';

const DEVICE_ID_POOL_SIZE = 5;
const deviceIds = Array.from({ length: DEVICE_ID_POOL_SIZE }, (_, i) => `synthetic-tests-${i}`);

function pickDeviceId(): string {
  return deviceIds[Math.floor(Math.random() * deviceIds.length)];
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

  const api = new TamanuApi({
    endpoint: `${context.vars.target}/api`,
    agentName: 'Tamanu Desktop',
    agentVersion: version,
    deviceId: pickDeviceId(),
    logger: console,
  });

  const loginResponse: any = await api.login(email, password);
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
