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

  try {
    const loginResponse = await api.login(email, password);
    const { user, availableFacilities, token } = loginResponse;

    let facilityId: string | null = null;
    if (availableFacilities && availableFacilities.length > 0) {
      facilityId = availableFacilities[0].id;

      // Set facility and get updated token
      const setFacilityResponse = await (api as any).post('setFacility', { facilityId });

      // The setFacility response contains a new token with facility context
      if (setFacilityResponse?.token) {
        api.setToken(setFacilityResponse.token);
      }
    }

    const entityFetcher = new RandomEntityFetcher(api);

    context.vars = {
      ...context.vars,
      api,
      entityFetcher,
      userId: user.id,
      facilityId,
      availableFacilities,
      token: api.hasToken() ? token : null,
      deviceId,
    };
  } catch (error) {
    console.error('Authentication failed:', error);
    throw error;
  }
}
