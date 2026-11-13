import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import * as jose from 'jose';

import { PORTAL_USER_STATUSES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
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
    const response = await baseApp
      .post('/api/portal/login')
      .send({ loginToken: token, email });
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
});
