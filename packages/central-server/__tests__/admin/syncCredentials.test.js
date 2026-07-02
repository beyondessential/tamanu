import bcrypt from 'bcrypt';
import { createTestContext } from '../utilities';

const ENDPOINT = '/api/admin/syncCredentials';

describe('Admin sync credentials', () => {
  let ctx;
  let baseApp;
  let models;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    ({ models } = ctx.store);
  });
  afterAll(async () => {
    await ctx.close();
  });

  it('rejects unauthenticated requests', async () => {
    const result = await baseApp
      .post(ENDPOINT)
      .send({ deviceId: 'device-anon', facilityIds: ['facility-a'] });
    expect(result).toHaveRequestError();
  });

  it('forbids non-admin users', async () => {
    const app = await baseApp.asRole('practitioner');
    const result = await app
      .post(ENDPOINT)
      .send({ deviceId: 'device-practitioner', facilityIds: ['facility-a'] });
    expect(result).toBeForbidden();
  });

  it('rejects an empty facility id list', async () => {
    const app = await baseApp.asRole('admin');
    const result = await app.post(ENDPOINT).send({ deviceId: 'device-empty', facilityIds: [] });
    expect(result).toHaveRequestError();
  });

  it('rejects a missing device id', async () => {
    const app = await baseApp.asRole('admin');
    const result = await app.post(ENDPOINT).send({ facilityIds: ['facility-a'] });
    expect(result).toHaveRequestError();
  });

  it('provisions a dedicated sync user for an admin and returns its credentials', async () => {
    const app = await baseApp.asRole('admin');
    const result = await app
      .post(ENDPOINT)
      .send({ deviceId: 'device-cred-a', facilityIds: ['facility-cred-a'] });

    expect(result).toHaveSucceeded();
    expect(result.body.email).toEqual(expect.any(String));
    expect(result.body.password).toEqual(expect.any(String));

    const user = await models.User.scope('withPassword').findOne({
      where: { email: result.body.email },
    });
    expect(user).toBeTruthy();
    expect(user.role).toBe('admin');
    expect(user.displayName).toContain('sync');
    // password is stored hashed, not as the returned plaintext
    expect(user.password).not.toBe(result.body.password);
    // and the returned plaintext actually authenticates against that hash
    expect(await bcrypt.compare(result.body.password, user.password)).toBe(true);
  });

  it('rotates the same account (new password) on repeat calls from the same device', async () => {
    const app = await baseApp.asRole('admin');
    const body = { deviceId: 'device-cred-rotate', facilityIds: ['facility-cred-rotate'] };

    const first = await app.post(ENDPOINT).send(body);
    const second = await app.post(ENDPOINT).send(body);

    expect(first).toHaveSucceeded();
    expect(second).toHaveSucceeded();
    expect(second.body.email).toBe(first.body.email);
    expect(second.body.password).not.toBe(first.body.password);

    const users = await models.User.findAll({ where: { email: first.body.email } });
    expect(users).toHaveLength(1);
  });

  it('provisions separate accounts for different devices with the same facilities', async () => {
    const app = await baseApp.asRole('admin');
    const facilityIds = ['facility-cred-shared'];

    const first = await app.post(ENDPOINT).send({ deviceId: 'device-shared-1', facilityIds });
    const second = await app.post(ENDPOINT).send({ deviceId: 'device-shared-2', facilityIds });

    expect(first).toHaveSucceeded();
    expect(second).toHaveSucceeded();
    expect(second.body.email).not.toBe(first.body.email);
  });
});
