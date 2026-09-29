import config from 'config';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ERROR_TYPE } from '@tamanu/errors';
import { fake } from '@tamanu/fake-data/fake';

import { buildToken } from '../../app/middleware/auth';
import { createTestContext } from '../utilities';

const MISSING_CREDENTIAL_PROBLEM = `/problems/${ERROR_TYPE.AUTH_CREDENTIAL_MISSING}`;

describe('FHIR route authentication', () => {
  let ctx;
  let baseApp;
  let deviceLessToken;
  let originalFhirEnabled;

  beforeAll(async () => {
    // The FHIR routes are only mounted when enabled at app creation
    originalFhirEnabled = config.integrations.fhir.enabled;
    config.integrations.fhir.enabled = true;
    ctx = await createTestContext();
    baseApp = ctx.baseApp;

    const { User } = ctx.models;
    const user = await User.create(fake(User, { role: 'admin' }));
    const [facilityId] = config.serverFacilityIds;
    deviceLessToken = await buildToken({ user, facilityId, expiresIn: '1d' });
  });

  afterAll(async () => {
    config.integrations.fhir.enabled = originalFhirEnabled;
    await ctx.close();
  });

  it.each(['/api/integration/fhir/mat/Patient', '/v1/integration/fhir/mat/Patient'])(
    'accepts a token without a device (%s)',
    async path => {
      const result = await baseApp.get(path).set('authorization', `Bearer ${deviceLessToken}`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('resourceType', 'Bundle');
    },
  );

  it('still requires a token', async () => {
    const result = await baseApp.get('/api/integration/fhir/mat/Patient');
    expect(result).toHaveRequestError();
  });

  it('requires a device on non-FHIR routes', async () => {
    const result = await baseApp
      .get('/api/user/me')
      .set('authorization', `Bearer ${deviceLessToken}`);
    expect(result.body).toHaveProperty('type', MISSING_CREDENTIAL_PROBLEM);
  });

  it('does not treat lookalike paths as FHIR routes', async () => {
    const result = await baseApp
      .get('/api/integration/fhir/materialised')
      .set('authorization', `Bearer ${deviceLessToken}`);
    expect(result.body).toHaveProperty('type', MISSING_CREDENTIAL_PROBLEM);
  });
});
