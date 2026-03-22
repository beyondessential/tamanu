import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';
import { DEVICE_SCOPES } from '@tamanu/constants';

const TEST_EMAIL = 'test@beyondessential.com.au';
const TEST_ROLE_EMAIL = 'testrole@bes.au';
const TEST_ROLE_ID = 'test-role-id';
const TEST_PASSWORD = '1Q2Q3Q4Q';
const TEST_DEVICE_ID = 'test-device-id';
const TEST_FACILITY = {
  id: 'testfacilityid',
  code: 'testfacilitycode',
  name: 'Test Facility',
};

const USERS = [
  {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    displayName: 'Test Beyond',
  },
  {
    email: TEST_ROLE_EMAIL,
    password: TEST_PASSWORD,
    displayName: 'Role Test BES',
    role: TEST_ROLE_ID,
  },
];

describe('Device auth', () => {
  let baseApp;
  let store;
  let close;
  let user;

  beforeEach(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Role, User, Facility } = store.models;
    [, user] = await Promise.all([
      Role.create(fake(Role, { id: TEST_ROLE_ID })),
      ...USERS.map(r => User.create(r)),
      Facility.create(TEST_FACILITY),
    ]);
  });

  afterEach(async () => close());

  it('should error if there is no quota for a new sync scoped device', async () => {
    const response = await baseApp.post('/api/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });

    expect(response).not.toHaveSucceeded();
  });

  it('should not error if there is no quota but we are not scoping', async () => {
    const response = await baseApp.post('/api/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
      scopes: [],
    });

    expect(response).toHaveSucceeded();
  });

  it('should error if there is not enough quota for a new sync scoped device', async () => {
    await user.update({ deviceRegistrationQuota: 2 });
    await store.models.Device.create({
      registeredById: user.id,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });
    await store.models.Device.create({
      registeredById: user.id,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });

    const response = await baseApp.post('/api/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });

    expect(response).not.toHaveSucceeded();
  });

  it('should not error if there is not enough quota for a new sync scoped device but we are not scoping', async () => {
    await user.update({ deviceRegistrationQuota: 2 });
    await store.models.Device.create({
      registeredById: user.id,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });
    await store.models.Device.create({
      registeredById: user.id,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });

    const response = await baseApp.post('/api/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
    });

    expect(response).toHaveSucceeded();
  });

  it('should succeed if there is enough quota for a new sync scoped device', async () => {
    await user.update({ deviceRegistrationQuota: 1 });

    const response = await baseApp.post('/api/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });

    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('token');
  });

  it('should succeed if the device is already registered', async () => {
    await store.models.Device.create({
      id: TEST_DEVICE_ID,
      registeredById: user.id,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });

    const response = await baseApp.post('/api/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });

    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('token');
  });

  it('should error if the device is already registered and has less scopes than requested', async () => {
    await store.models.Device.create({
      id: TEST_DEVICE_ID,
      registeredById: user.id,
      scopes: [],
    });

    const response = await baseApp.post('/api/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });

    expect(response).not.toHaveSucceeded();
  });

  it('should succeed if the device is already registered by another user', async () => {
    await store.models.Device.create({
      id: TEST_DEVICE_ID,
      registeredById: user.id,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });

    const response = await baseApp.post('/api/login').send({
      email: TEST_ROLE_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });

    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('token');
  });
});
