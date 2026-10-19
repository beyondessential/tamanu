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
});
