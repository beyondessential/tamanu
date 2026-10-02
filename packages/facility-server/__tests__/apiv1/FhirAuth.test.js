import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { FHIR_INTEGRATION_VERB } from '@tamanu/constants';
import { ERROR_TYPE, Problem } from '@tamanu/errors';
import { fake } from '@tamanu/fake-data/fake';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { decodeJwt } from 'jose';
import { pick } from 'es-toolkit/compat';

import { getServerFacilityIds } from '../../app/serverConfig';
import { CentralServerConnection } from '../../app/sync/CentralServerConnection';
import { createTestContext } from '../utilities';

const MISSING_CREDENTIAL_PROBLEM = `/problems/${ERROR_TYPE.AUTH_CREDENTIAL_MISSING}`;
const PASSWORD = 'PASSWORD';

describe('FHIR integration authentication', () => {
  disableHardcodedPermissionsForSuite();

  let ctx;
  let baseApp;
  let centralServer;
  let integrationUser;
  let clinicalUser;

  const loginWithoutDevice = user =>
    baseApp.post('/api/login').send({ email: user.email, password: PASSWORD });

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    centralServer = ctx.centralServer;
    CentralServerConnection.mockImplementation(function () {
      return centralServer;
    });

    const { Permission, Role, User, UserFacility } = ctx.models;
    const [facilityId] = getServerFacilityIds();

    const integrationRole = await Role.create(fake(Role));
    await Permission.create({
      roleId: integrationRole.id,
      verb: FHIR_INTEGRATION_VERB,
      noun: 'PMI',
    });
    const clinicalRole = await Role.create(fake(Role));
    await Permission.create({ roleId: clinicalRole.id, verb: 'read', noun: 'Patient' });

    integrationUser = await User.create(
      fake(User, { password: PASSWORD, role: integrationRole.id }),
    );
    clinicalUser = await User.create(fake(User, { password: PASSWORD, role: clinicalRole.id }));
    for (const user of [integrationUser, clinicalUser]) {
      await UserFacility.create({ userId: user.id, facilityId });
    }

    vi.spyOn(ctx.models.UserLoginAttempt, 'checkIsUserLockedOut').mockResolvedValue({
      isUserLockedOut: false,
      remainingLockout: 0,
    });
  });

  afterAll(() => ctx.close());

  describe('login without a deviceId', () => {
    beforeEach(() => {
      CentralServerConnection.mockClear();
      centralServer.login.mockClear();
    });

    it('succeeds locally for a user with FHIR integration permissions', async () => {
      const result = await loginWithoutDevice(integrationUser);
      expect(result).toHaveSucceeded();
      expect(decodeJwt(result.body.token).deviceId).toBeUndefined();
    });

    it('is rejected for a user without FHIR integration permissions', async () => {
      const result = await loginWithoutDevice(clinicalUser);
      expect(result).toHaveStatus(400);
      expect(result.body).toHaveProperty('type', MISSING_CREDENTIAL_PROBLEM);
    });

    it('still succeeds with a deviceId for a user without FHIR integration permissions', async () => {
      const result = await baseApp
        .post('/api/login')
        .send({ email: clinicalUser.email, password: PASSWORD, deviceId: 'test-device-id' });
      expect(result).toHaveSucceeded();
    });

    describe('when central login is attempted', () => {
      beforeEach(() => {
        vi.stubEnv('ENABLE_CENTRAL_LOGIN_IN_TEST', 'true');
      });
      afterEach(() => {
        vi.unstubAllEnvs();
      });

      it('goes through central using the facility server device', async () => {
        centralServer.login.mockResolvedValueOnce({
          user: pick(integrationUser, ['id', 'role', 'email', 'displayName']),
          localisation: {},
          allowedFacilities: await integrationUser.allowedFacilities(),
        });

        const result = await loginWithoutDevice(integrationUser);

        expect(result).toHaveSucceeded();
        expect(result.body.central).toBe(true);
        expect(CentralServerConnection).toHaveBeenCalledWith({ deviceId: ctx.deviceId });
        expect(decodeJwt(result.body.token).deviceId).toBeUndefined();
      });

      it('does not fall back to local login when central rejects the credentials', async () => {
        centralServer.login.mockRejectedValueOnce(
          new Problem(ERROR_TYPE.AUTH_CREDENTIAL_INVALID, 'Invalid credentials', 401),
        );

        const result = await loginWithoutDevice(integrationUser);

        expect(centralServer.login).toHaveBeenCalledTimes(1);
        expect(result).toHaveRequestError();
      });

      it('falls back to local login when central is incompatible', async () => {
        centralServer.login.mockRejectedValueOnce(
          new Problem(ERROR_TYPE.REMOTE_INCOMPATIBLE, 'Central login unavailable', 400),
        );

        const result = await loginWithoutDevice(integrationUser);

        expect(result).toHaveSucceeded();
        expect(result.body.central).toBe(false);
      });
    });
  });

  describe('device-less tokens', () => {
    let deviceLessToken;

    beforeAll(async () => {
      const result = await loginWithoutDevice(integrationUser);
      deviceLessToken = result.body.token;
    });

    it.each(['/api/integration/fhir/mat/Patient', '/v1/integration/fhir/mat/Patient'])(
      'are accepted by FHIR routes (%s)',
      async path => {
        const result = await baseApp.get(path).set('authorization', `Bearer ${deviceLessToken}`);
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('resourceType', 'Bundle');
      },
    );

    it('are rejected by non-FHIR routes', async () => {
      const result = await baseApp
        .get('/api/user/me')
        .set('authorization', `Bearer ${deviceLessToken}`);
      expect(result.body).toHaveProperty('type', MISSING_CREDENTIAL_PROBLEM);
    });

    it('are rejected by lookalike paths', async () => {
      const result = await baseApp
        .get('/api/integration/fhir/materialised')
        .set('authorization', `Bearer ${deviceLessToken}`);
      expect(result.body).toHaveProperty('type', MISSING_CREDENTIAL_PROBLEM);
    });

    it('are still required by FHIR routes', async () => {
      const result = await baseApp.get('/api/integration/fhir/mat/Patient');
      expect(result).toHaveRequestError();
    });
  });
});
