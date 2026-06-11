import config from 'config';

import { fake } from '@tamanu/fake-data/fake';
import { SERVER_TYPES } from '@tamanu/constants';
import { selectFacilityIds } from '@tamanu/utils/selectFacilityIds';

import { createTestContext } from '../utilities';
import { CentralServerConnection } from '../../dist/sync/CentralServerConnection';

const DEVICE_ID = 'test-mfa-device';
// a facility configured on this server, so the post-completion access check passes
const [serverFacilityId] = selectFacilityIds(config);

// A central /login (or /mfa/login completion) success payload, as the facility
// would receive it over forwardRequest.
const centralLoginPayload = user => ({
  user: { id: user.id, role: user.role, email: user.email, displayName: user.displayName },
  localisation: { foo: 'bar' },
  allowedFacilities: [{ id: serverFacilityId, name: serverFacilityId }],
  primaryTimeZone: 'Australia/Melbourne',
  token: 'central-access-token',
  refreshToken: 'central-refresh-token',
  permissions: [],
  server: { type: 'central' },
});

describe('Facility MFA login forwarding', () => {
  let ctx;
  let baseApp;
  let models;
  let centralServer;
  let user;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    centralServer = ctx.centralServer;
    CentralServerConnection.mockImplementation(() => centralServer);

    user = await models.User.create(
      fake(models.User, { role: 'practitioner', email: 'mfa-fwd@example.com' }),
    );
  });

  afterAll(() => ctx.close());

  beforeEach(() => {
    centralServer.forwardRequest.mockReset();
  });

  describe('pass-through (begin / enrol) routes', () => {
    it.each([
      ['/api/mfa/login/webauthn/assert-begin', 'mfa/login/webauthn/assert-begin'],
      ['/api/mfa/login/webauthn/register-begin', 'mfa/login/webauthn/register-begin'],
      ['/api/mfa/login/totp/enrol', 'mfa/login/totp/enrol'],
    ])('forwards %s to central verbatim and returns its payload', async (route, centralEndpoint) => {
      const centralResponse = { challenge: 'abc', allowCredentials: [] };
      centralServer.forwardRequest.mockResolvedValueOnce(centralResponse);

      const response = await baseApp.post(route).send({ mfaToken: 'pending-token', deviceId: DEVICE_ID });

      expect(response).toHaveSucceeded();
      expect(response.body).toEqual(centralResponse);
      // forwarded to the matching central endpoint, no token minted here
      expect(centralServer.forwardRequest).toHaveBeenCalledWith(expect.anything(), centralEndpoint);
      expect(response.body.token).toBeUndefined();
    });
  });

  describe('terminal (finalise) routes', () => {
    it('completes a TOTP login: lands central user locally and returns a facility session', async () => {
      centralServer.forwardRequest.mockResolvedValueOnce(centralLoginPayload(user));

      const response = await baseApp
        .post('/api/mfa/login/totp')
        .send({ mfaToken: 'pending-token', deviceId: DEVICE_ID, code: '123456' });

      expect(response).toHaveSucceeded();
      expect(centralServer.forwardRequest).toHaveBeenCalledWith(expect.anything(), 'mfa/login/totp');
      // facility-shaped response, not central's
      expect(response.body).toMatchObject({
        token: expect.any(String),
        central: true,
        serverType: SERVER_TYPES.FACILITY,
        availableFacilities: [{ id: serverFacilityId, name: serverFacilityId }],
      });
      expect(response.body.permissions).toEqual(expect.any(Array));

      // the central user was mirrored locally and the device registered
      const localUser = await models.User.findByPk(user.id);
      expect(localUser).toBeTruthy();
      const device = await models.Device.findByPk(DEVICE_ID);
      expect(device).toBeTruthy();
    });

    it('also finalises the webauthn assert-finish route', async () => {
      centralServer.forwardRequest.mockResolvedValueOnce(centralLoginPayload(user));
      const response = await baseApp
        .post('/api/mfa/login/webauthn/assert-finish')
        .send({ mfaToken: 'pending-token', deviceId: DEVICE_ID, assertionResponse: { id: 'x' } });
      expect(response).toHaveSucceeded();
      expect(centralServer.forwardRequest).toHaveBeenCalledWith(
        expect.anything(),
        'mfa/login/webauthn/assert-finish',
      );
      expect(response.body.serverType).toBe(SERVER_TYPES.FACILITY);
    });

    it('rejects when the user has no access to a facility on this server', async () => {
      centralServer.forwardRequest.mockResolvedValueOnce({
        ...centralLoginPayload(user),
        allowedFacilities: [{ id: 'not-on-this-server', name: 'Elsewhere' }],
      });
      const response = await baseApp
        .post('/api/mfa/login/totp')
        .send({ mfaToken: 'pending-token', deviceId: DEVICE_ID, code: '123456' });
      expect(response).not.toHaveSucceeded();
    });

    it('propagates a central forwarding failure', async () => {
      centralServer.forwardRequest.mockRejectedValueOnce(new Error('central is down'));
      const response = await baseApp
        .post('/api/mfa/login/totp')
        .send({ mfaToken: 'pending-token', deviceId: DEVICE_ID, code: '123456' });
      expect(response).not.toHaveSucceeded();
    });
  });

  describe('enrolment-invite forwarding', () => {
    it.each([
      ['/api/mfa/enrolInvite/redeem', 'mfa/enrolInvite/redeem'],
      ['/api/mfa/enrolInvite/webauthn/register-begin', 'mfa/enrolInvite/webauthn/register-begin'],
      ['/api/mfa/enrolInvite/totp/enrol', 'mfa/enrolInvite/totp/enrol'],
      ['/api/mfa/enrolInvite/totp/confirm', 'mfa/enrolInvite/totp/confirm'],
    ])('forwards %s to central verbatim', async (route, centralEndpoint) => {
      const centralResponse = { anything: 'central said' };
      centralServer.forwardRequest.mockResolvedValueOnce(centralResponse);

      const response = await baseApp
        .post(route)
        .send({ enrolToken: 'session-token', code: '123456' });

      expect(response).toHaveSucceeded();
      expect(response.body).toEqual(centralResponse);
      expect(centralServer.forwardRequest).toHaveBeenCalledWith(expect.anything(), centralEndpoint);
    });
  });

  it('requires no auth (the pending token is the authority)', async () => {
    // unauthenticated request still reaches the forwarder
    centralServer.forwardRequest.mockResolvedValueOnce({ challenge: 'abc' });
    const response = await baseApp
      .post('/api/mfa/login/webauthn/assert-begin')
      .send({ mfaToken: 'pending-token', deviceId: DEVICE_ID });
    expect(response).toHaveSucceeded();
  });
});
