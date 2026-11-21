import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import * as jose from 'jose';

import { PORTAL_USER_STATUSES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { JWT_TOKEN_TYPES } from '@tamanu/constants/auth';
import { fake } from '@tamanu/fake-data/fake';
import { settingsCache } from '@tamanu/settings';
import { getCanonicalHostName } from '@tamanu/shared/utils';
import { buildToken } from '../../app/auth/utils';
import { createTestContext } from '../utilities';
import { PortalOneTimeTokenService } from '../../app/patientPortalApi/auth/PortalOneTimeTokenService';

const SHARED_EMAIL = 'parent@test.com';

describe('Patient Portal profiles', () => {
  let baseApp;
  let store;
  let close;
  let parentPortalUser;
  let childPortalUser;
  let pendingChildPortalUser;
  let otherEmailPortalUser;
  let deceasedPortalUser;
  let deactivatedPortalUser;

  const createPortalUser = async ({ email, status, patient = {}, visibilityStatus }) => {
    const { Patient, PortalUser } = store.models;
    const createdPatient = await Patient.create(fake(Patient, patient));
    return PortalUser.create({ email, status, visibilityStatus, patientId: createdPatient.id });
  };

  const loginAs = async (portalUser, email = SHARED_EMAIL) => {
    const oneTimeTokenService = new PortalOneTimeTokenService(store.models);
    const { token } = await oneTimeTokenService.createLoginToken(portalUser.id);
    const response = await baseApp.post('/api/portal/login').send({ loginToken: token, email });
    expect(response).toHaveSucceeded();
    return response.body.token;
  };

  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    await store.models.Setting.set('features.patientPortal', true);

    // Created first, so a lookup that takes the oldest row would land on it
    pendingChildPortalUser = await createPortalUser({
      email: SHARED_EMAIL,
      status: PORTAL_USER_STATUSES.PENDING,
    });
    parentPortalUser = await createPortalUser({
      email: SHARED_EMAIL,
      status: PORTAL_USER_STATUSES.REGISTERED,
    });
    childPortalUser = await createPortalUser({
      email: SHARED_EMAIL.toUpperCase(),
      status: PORTAL_USER_STATUSES.REGISTERED,
    });
    deceasedPortalUser = await createPortalUser({
      email: SHARED_EMAIL,
      status: PORTAL_USER_STATUSES.REGISTERED,
      patient: { dateOfDeath: new Date().toISOString() },
    });
    deactivatedPortalUser = await createPortalUser({
      email: SHARED_EMAIL,
      status: PORTAL_USER_STATUSES.REGISTERED,
      visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
    });
    otherEmailPortalUser = await createPortalUser({
      email: 'someone-else@test.com',
      status: PORTAL_USER_STATUSES.REGISTERED,
    });
  });

  afterAll(async () => close());

  it('issues a login code against a registered patient sharing the email', async () => {
    const spy = vi.spyOn(PortalOneTimeTokenService.prototype, 'createLoginToken');
    const response = await baseApp
      .post('/api/portal/request-login-token')
      .send({ email: SHARED_EMAIL });
    expect(response).toHaveSucceeded();
    expect(spy).toHaveBeenCalledWith(parentPortalUser.id, expect.any(Number));
    spy.mockRestore();
  });

  it('refuses a login code for an email with no registered patient', async () => {
    const email = 'pending-only@test.com';
    await createPortalUser({ email, status: PORTAL_USER_STATUSES.PENDING });
    const response = await baseApp.post('/api/portal/request-login-token').send({ email });
    expect(response).toHaveRequestError();
  });

  it('lists a patient missing optional details', async () => {
    const email = 'incomplete@test.com';
    const portalUser = await createPortalUser({
      email,
      status: PORTAL_USER_STATUSES.REGISTERED,
      patient: { firstName: null, dateOfBirth: null },
    });
    await createPortalUser({ email, status: PORTAL_USER_STATUSES.REGISTERED });
    const token = await loginAs(portalUser, email);
    const response = await baseApp
      .get('/api/portal/profiles')
      .set('Authorization', `Bearer ${token}`);
    expect(response).toHaveSucceeded();
    expect(response.body.data).toHaveLength(2);
  });

  it('refuses a code redeemed with another email, and leaves it usable', async () => {
    const oneTimeTokenService = new PortalOneTimeTokenService(store.models);
    const { token: loginToken } = await oneTimeTokenService.createLoginToken(parentPortalUser.id);

    const wrongEmail = await baseApp
      .post('/api/portal/login')
      .send({ loginToken, email: otherEmailPortalUser.email });
    expect(wrongEmail).toHaveRequestError();

    const rightEmail = await baseApp
      .post('/api/portal/login')
      .send({ loginToken, email: SHARED_EMAIL });
    expect(rightEmail).toHaveSucceeded();
  });

  it('signs in as whichever patient the code was issued against', async () => {
    const token = await loginAs(childPortalUser);
    expect(jose.decodeJwt(token).portalUserId).toBe(childPortalUser.id);
  });

  it('lists the registered, living patients sharing the email', async () => {
    const token = await loginAs(parentPortalUser);
    const response = await baseApp
      .get('/api/portal/profiles')
      .set('Authorization', `Bearer ${token}`);

    expect(response).toHaveSucceeded();
    expect(response.body.email).toBe(SHARED_EMAIL);
    expect(response.body.data.map(({ portalUserId }) => portalUserId).sort()).toEqual(
      [parentPortalUser.id, childPortalUser.id].sort(),
    );
  });

  it('switches to another profile without extending the session', async () => {
    await store.models.Setting.set('patientPortal.tokenDuration', '5m');
    const parentToken = await loginAs(parentPortalUser);
    await store.models.Setting.set('patientPortal.tokenDuration', '24h');
    const response = await baseApp
      .post(`/api/portal/profiles/${childPortalUser.id}/select`)
      .set('Authorization', `Bearer ${parentToken}`);
    expect(response).toHaveSucceeded();

    const childToken = response.body.token;
    expect(jose.decodeJwt(childToken).exp).toBe(jose.decodeJwt(parentToken).exp);

    const me = await baseApp.get('/api/portal/me').set('Authorization', `Bearer ${childToken}`);
    expect(me).toHaveSucceeded();
    expect(me.body.id).toBe(childPortalUser.patientId);
  });

  it('lists the profiles for a session token that carries no email', async () => {
    const token = await buildToken({ portalUserId: parentPortalUser.id }, undefined, {
      expiresIn: '1h',
      audience: JWT_TOKEN_TYPES.PATIENT_PORTAL_ACCESS,
      issuer: getCanonicalHostName(),
    });
    const response = await baseApp
      .get('/api/portal/profiles')
      .set('Authorization', `Bearer ${token}`);

    expect(response).toHaveSucceeded();
    expect(response.body.data.map(({ portalUserId }) => portalUserId).sort()).toEqual(
      [parentPortalUser.id, childPortalUser.id].sort(),
    );
  });

  it('records an access for each patient listed and for the one switched to', async () => {
    const { AccessLog, Setting } = store.models;
    await Setting.set('audit.accesses.enabled', true);
    settingsCache.reset();
    try {
      const token = await loginAs(parentPortalUser);
      await AccessLog.truncate();

      await baseApp.get('/api/portal/profiles').set('Authorization', `Bearer ${token}`);
      const listed = await AccessLog.findAll();
      expect(listed.map(({ recordId }) => recordId).sort()).toEqual(
        [parentPortalUser.patientId, childPortalUser.patientId].sort(),
      );

      await AccessLog.truncate();
      await baseApp
        .post(`/api/portal/profiles/${childPortalUser.id}/select`)
        .set('Authorization', `Bearer ${token}`);
      const switched = await AccessLog.findAll();
      expect(switched.map(({ recordId }) => recordId)).toEqual([childPortalUser.patientId]);
    } finally {
      await Setting.set('audit.accesses.enabled', false);
      settingsCache.reset();
    }
  });

  it.each([
    ['a patient with a different email', () => otherEmailPortalUser],
    ['a patient not yet registered', () => pendingChildPortalUser],
    ['a deceased patient', () => deceasedPortalUser],
    ['a deactivated portal user', () => deactivatedPortalUser],
  ])('refuses to switch to %s', async (_, getPortalUser) => {
    const token = await loginAs(parentPortalUser);
    const response = await baseApp
      .post(`/api/portal/profiles/${getPortalUser().id}/select`)
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it.each([
    ['list profiles', () => baseApp.get('/api/portal/profiles')],
    ['switch profile', () => baseApp.post(`/api/portal/profiles/${childPortalUser.id}/select`)],
  ])('requires authentication to %s', async (_, request) => {
    const response = await request();
    expect(response).toHaveRequestError();
  });

  it('keeps the session to the email signed in with after the email changes', async () => {
    const otherFamilyEmail = 'other-family@test.com';
    const movingPortalUser = await createPortalUser({
      email: 'moving@test.com',
      status: PORTAL_USER_STATUSES.REGISTERED,
    });
    const otherFamilyPortalUser = await createPortalUser({
      email: otherFamilyEmail,
      status: PORTAL_USER_STATUSES.REGISTERED,
    });
    const token = await loginAs(movingPortalUser, 'moving@test.com');
    await movingPortalUser.update({ email: otherFamilyEmail });

    const profiles = await baseApp
      .get('/api/portal/profiles')
      .set('Authorization', `Bearer ${token}`);
    expect(profiles).toHaveSucceeded();
    expect(profiles.body.data).toEqual([]);

    const select = await baseApp
      .post(`/api/portal/profiles/${otherFamilyPortalUser.id}/select`)
      .set('Authorization', `Bearer ${token}`);
    expect(select.status).toBe(404);
  });
});
