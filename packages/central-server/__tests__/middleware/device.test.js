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
    role: TEST_ROLE_ID,
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
    await Role.create(fake(Role, { id: TEST_ROLE_ID }));
    [user] = await Promise.all([
      ...USERS.map(r => User.create(r)),
      Facility.create(TEST_FACILITY),
    ]);
  });

  afterEach(async () => close());

  it('should error if user has no device registration permission', async () => {
    // No permission created - user cannot register devices
    const response = await baseApp.post('/api/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
      scopes: [DEVICE_SCOPES.SYNC_CLIENT],
    });

    expect(response).not.toHaveSucceeded();
  });

  it('should not error if there is no permission but we are not scoping', async () => {
    const response = await baseApp.post('/api/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
      scopes: [],
    });

    expect(response).toHaveSucceeded();
  });

  it('should error if user has single permission and already has a device', async () => {
    // Create single device registration permission for the role
    await store.models.Permission.create({
      roleId: TEST_ROLE_ID,
      verb: 'create',
      noun: 'SingleDeviceRegistration',
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

  it('should not error if user has single permission and already has a device but we are not scoping', async () => {
    await store.models.Permission.create({
      roleId: TEST_ROLE_ID,
      verb: 'create',
      noun: 'SingleDeviceRegistration',
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

  it('should succeed if user has single permission and no devices yet', async () => {
    await store.models.Permission.create({
      roleId: TEST_ROLE_ID,
      verb: 'create',
      noun: 'SingleDeviceRegistration',
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

  it('should succeed if user has unlimited permission even with existing devices', async () => {
    // Create unlimited device registration permission for the role
    await store.models.Permission.create({
      roleId: TEST_ROLE_ID,
      verb: 'create',
      noun: 'UnlimitedSingleDeviceRegistration',
    });
    // Create multiple existing devices
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
