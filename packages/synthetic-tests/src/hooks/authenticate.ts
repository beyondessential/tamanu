import { RandomEntityFetcher } from '@tamanu/fake-data/services/RandomEntityFetcher';

import { TamanuApi } from '@tamanu/api-client';
import { version } from '../../package.json';

/**
 * Authenticates the user and stores the token, facility ID, and user ID in context.vars.
 */
export async function authenticate(context: any, _events: any): Promise<void> {
  const { email = 'admin@tamanu.io', password = 'admin' } = context.vars;

  const deviceId = `synthetic-tests-${crypto.randomUUID()}`;

  const api = new TamanuApi({
    endpoint: `${context.vars.target}/api`,
    agentName: 'Tamanu Desktop',
    agentVersion: version,
    deviceId,
    logger: console,
  });

  const loginResponse = await api.login(email, password);
  const { user, availableFacilities } = loginResponse;

  let token = loginResponse.token;
  const facilityId = availableFacilities?.[0]?.id ?? null;
  if (facilityId) {
    const setFacilityResponse = await api.post('setFacility', { facilityId });
    if (setFacilityResponse?.token) {
      token = setFacilityResponse.token;
      api.setToken(token);
    }
  }

  context.vars = {
    ...context.vars,
    api,
    entityFetcher: new RandomEntityFetcher(api),
    token,
    userId: user.id,
    facilityId,
    availableFacilities,
    deviceId,
  };
}
