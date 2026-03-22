import { fake } from '@tamanu/fake-data/fake';
import { createTestContext } from '../utilities';

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

describe('Auth', () => {
  let baseApp;
  let store;
  let close;
  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    const { Role, User, Facility, Device } = store.models;
    const [, user] = await Promise.all([
      Role.create(fake(Role, { id: TEST_ROLE_ID })),
      ...USERS.map(r => User.create(r)),
      Facility.create(TEST_FACILITY),
    ]);
    await Device.create({
      id: TEST_DEVICE_ID,
      registeredById: user.id,
    });
  });

  afterAll(async () => close());

  describe('User management', () => {
    test.todo('Should prevent user creation without appropriate permission');
    test.todo('Should prevent password change without appropriate permission');
  });

  it('Should answer a whoami request correctly', async () => {
    // first, log in and get token
    const response = await baseApp.post('/api/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
    });

    expect(response).toHaveSucceeded();
    const { token } = response.body;

    // then run the whoami request
    const whoamiResponse = await baseApp.get('/api/whoami').set('Authorization', `Bearer ${token}`);
    expect(whoamiResponse).toHaveSucceeded();

    const { body } = whoamiResponse;
    expect(body).toHaveProperty('email', TEST_EMAIL);
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('hashedPassword');
  });

  it('Should send permissions alongside login information', async () => {
    const response = await baseApp.post('/api/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      deviceId: TEST_DEVICE_ID,
    });

    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('permissions');
  });
});
