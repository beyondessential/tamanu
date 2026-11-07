import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

describe('Admin users — email normalisation and case-insensitive uniqueness', () => {
  let ctx;
  let models;
  let adminApp;
  let role;

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    adminApp = await ctx.baseApp.asRole('admin');
    role = await models.Role.create(fake(models.Role));
  });
  afterAll(async () => {
    await ctx.close();
  });

  const createUser = (email, displayName) =>
    adminApp.post('/api/admin/users').send({
      displayName,
      role: role.id,
      email,
      password: 'test-password',
    });

  it('trims surrounding whitespace from the email on create', async () => {
    expect(await createUser('  trimmed@tamanu.io  ', 'Trimmed')).toHaveSucceeded();

    const user = await models.User.findOne({ where: { email: 'trimmed@tamanu.io' } });
    expect(user).toBeTruthy();
    expect(user.email).toBe('trimmed@tamanu.io');
  });

  it('rejects a new user whose email differs only in case', async () => {
    expect(await createUser('CaseDupe@tamanu.io', 'Case Dupe')).toHaveSucceeded();

    const response = await createUser('casedupe@tamanu.io', 'Case Dupe 2');
    expect(response).toHaveRequestError();
    expect(response.statusCode).toBe(422);
  });

  it('reports a case-variant email as not unique via /validate', async () => {
    expect(await createUser('Validate@tamanu.io', 'Validate')).toHaveSucceeded();

    const response = await adminApp.post('/api/admin/users/validate').send({
      displayName: 'Validate Check',
      role: role.id,
      email: 'validate@tamanu.io',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.isEmailUnique).toBe(false);
  });

  it('reports a genuinely unique email as unique via /validate', async () => {
    const response = await adminApp.post('/api/admin/users/validate').send({
      displayName: 'Genuinely Unique Name',
      role: role.id,
      email: 'genuinely-unique@tamanu.io',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.isEmailUnique).toBe(true);
  });

  it('does not flag a user as a duplicate of itself when re-casing its own email via /validate', async () => {
    expect(await createUser('SelfEdit@tamanu.io', 'Self Edit')).toHaveSucceeded();
    const user = await models.User.findOne({ where: { email: 'SelfEdit@tamanu.io' } });

    const response = await adminApp.post('/api/admin/users/validate').send({
      id: user.id,
      displayName: 'Self Edit',
      role: role.id,
      email: 'selfedit@tamanu.io',
    });
    expect(response).toHaveSucceeded();
    expect(response.body.isEmailUnique).toBe(true);
  });

  it('rejects updating a user to an email that case-insensitively matches another', async () => {
    expect(await createUser('ExistingA@tamanu.io', 'Existing A')).toHaveSucceeded();
    expect(await createUser('ExistingB@tamanu.io', 'Existing B')).toHaveSucceeded();
    const userB = await models.User.findOne({ where: { email: 'ExistingB@tamanu.io' } });

    const response = await adminApp.put(`/api/admin/users/${userB.id}`).send({
      visibilityStatus: VISIBILITY_STATUSES.CURRENT,
      displayName: 'Existing B',
      role: role.id,
      email: 'existinga@tamanu.io',
    });
    expect(response).toHaveRequestError();
    expect(response.statusCode).toBe(409);
  });

  describe('authorisation', () => {
    let nonAdminApp;
    let target;

    beforeAll(async () => {
      nonAdminApp = await ctx.baseApp.asRole('base');
      expect(await createUser('AuthzTarget@tamanu.io', 'Authz Target')).toHaveSucceeded();
      target = await models.User.findOne({ where: { email: 'AuthzTarget@tamanu.io' } });
    });

    it('forbids a least-privilege user from creating a user', async () => {
      const response = await nonAdminApp.post('/api/admin/users').send({
        displayName: 'No Permission',
        role: role.id,
        email: 'no-permission@tamanu.io',
        password: 'test-password',
      });
      expect(response).toBeForbidden();
    });

    it('forbids a least-privilege user from updating a user', async () => {
      const response = await nonAdminApp.put(`/api/admin/users/${target.id}`).send({
        visibilityStatus: VISIBILITY_STATUSES.CURRENT,
        displayName: 'Authz Target',
        role: role.id,
        email: 'authztarget@tamanu.io',
      });
      expect(response).toBeForbidden();
    });

    it('allows any authenticated user to call /validate (permission check intentionally skipped)', async () => {
      const response = await nonAdminApp.post('/api/admin/users/validate').send({
        displayName: 'Anyone',
        role: role.id,
        email: 'anyone-validate@tamanu.io',
      });
      expect(response).toHaveSucceeded();
    });
  });
});
