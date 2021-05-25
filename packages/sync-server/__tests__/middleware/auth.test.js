import { createTestContext } from '../utilities';

const TEST_EMAIL = 'test@beyondessential.com.au';
const TEST_PASSWORD = '1Q2Q3Q4Q';

const USERS = [
  {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    displayName: 'Test Beyond',
  },
];

describe('Auth', () => {
  let baseApp;
  let app;
  let store;
  let close;
  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    app = await baseApp.asRole('practitioner');

    await Promise.all(USERS.map(r => ctx.store.models.User.create(r)));
  });

  afterAll(async () => close());

  describe('Logging in', () => {
    it('Should get a token for correct credentials', async () => {
      const response = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('token');
    });

    it('Should respond with user details with correct credentials', async () => {
      const response = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('user.id');
      expect(response.body).toHaveProperty('user.email', TEST_EMAIL);
      expect(response.body).toHaveProperty('user.displayName');

      expect(response.body).not.toHaveProperty('user.password');
      expect(response.body).not.toHaveProperty('user.hashedPassword');
    });

    it('Should return feature flags in the login response', async () => {
      const response = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      expect(response).toHaveSucceeded();
      expect(response.body).toHaveProperty('localisation.fields.displayId', {
        shortLabel: 'NHN',
        longLabel: 'National Health Number',
      });
    });

    it('Should reject an empty credential', async () => {
      const response = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: '',
      });
      expect(response).toHaveRequestError();
    });

    it('Should reject an incorrect password', async () => {
      const response = await baseApp.post('/v1/login').send({
        email: TEST_EMAIL,
        password: 'not the password',
      });
      expect(response).toHaveRequestError();
    });
  });

  describe('User management', () => {
    const USER_EMAIL = 'user.management@tamanu.test.io';
    const DISPLAY_NAME = 'John Jones';
    const USER_PASSWORD = 'abc_123';
    const USER_PASSWORD_2 = 'abc_1234';

    it('Should hash a password for a user synced through the api', async () => {
      const response = await app.post('/v1/sync/user').send({
        data: {
          email: USER_EMAIL,
          password: USER_PASSWORD,
          displayName: DISPLAY_NAME,
        },
      });
      expect(response).toHaveSucceeded();

      const savedUser = await store.findUser(USER_EMAIL);
      expect(savedUser).toHaveProperty('password');
      expect(savedUser.password.slice(0, 2)).toBe('$2'); // magic number for bcrypt hashes

      const loginResponse = await baseApp.post('/v1/login').send({
        email: USER_EMAIL,
        password: USER_PASSWORD,
      });
      expect(loginResponse).toHaveSucceeded();
      expect(loginResponse.body).toEqual({
        token: expect.any(String),
        user: {
          id: expect.any(String),
          email: USER_EMAIL,
          displayName: DISPLAY_NAME,
          role: 'practitioner',
        },
        localisation: expect.any(Object),
      });
    });

    it('Should hash an updated password for an existing user', async () => {
      const response = await app.post('/v1/upsertUser').send({
        data: {
          email: USER_EMAIL,
          password: USER_PASSWORD_2,
          displayName: DISPLAY_NAME,
        },
      });
      expect(response).toHaveSucceeded();

      const savedUser = await store.findUser(USER_EMAIL);
      expect(savedUser).toHaveProperty('password');
      expect(savedUser).toHaveProperty('displayName', DISPLAY_NAME);
      expect(savedUser.password.slice(0, 2)).toBe('$2'); // magic number for bcrypt hashes

      // fail login with old password
      const loginResponse = await baseApp.post('/v1/login').send({
        email: USER_EMAIL,
        password: USER_PASSWORD,
      });
      expect(loginResponse).toHaveRequestError();

      // succeed login with new password
      const loginResponse2 = await baseApp.post('/v1/login').send({
        email: USER_EMAIL,
        password: USER_PASSWORD_2,
      });
      expect(loginResponse2).toHaveSucceeded();
    });

    it('Should include a new user in the GET /sync/user channel', async () => {
      const now = new Date().valueOf();
      const newEmail = 'new-user-get@test.tamanu.io';
      const displayName = 'test-new';

      const response = await app.post('/v1/upsertUser').send({
        data: {
          email: newEmail,
          displayName,
          password: USER_PASSWORD,
        },
      });
      expect(response).toHaveSucceeded();

      const syncResponse = await app.get(`/v1/sync/user?since=${now}`);
      expect(syncResponse).toHaveSucceeded();
      const found = syncResponse.body.records.find(x => x.data.email === newEmail);
      expect(found).toBeDefined();
      expect(found).toHaveProperty('data.displayName', displayName);
    });

    it('Should include an updated user in the GET /sync/user channel', async () => {
      const now = new Date().valueOf();
      const displayNameUpdated = 'updated display name';

      const response = await app.post('/v1/upsertUser').send({
        recordType: 'user',
        data: {
          email: USER_EMAIL,
          displayName: displayNameUpdated,
        },
      });
      expect(response).toHaveSucceeded();

      const syncResponse = await app.get(`/v1/sync/user?since=${now}`);
      expect(syncResponse).toHaveSucceeded();
      const found = syncResponse.body.records.find(x => x.data.email === USER_EMAIL);
      expect(found).toBeDefined();
      expect(found).toHaveProperty('data.displayName', displayNameUpdated);
    });

    test.todo('Should prevent user creation without appropriate permission');
    test.todo('Should prevent password change without appropriate permission');
  });

  it('Should answer a whoami request correctly', async () => {
    // first, log in and get token
    const response = await baseApp.post('/v1/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(response).toHaveSucceeded();
    const { token } = response.body;

    // then run the whoami request
    const whoamiResponse = await baseApp.get('/v1/whoami').set('Authorization', `Bearer ${token}`);
    expect(whoamiResponse).toHaveSucceeded();

    const { body } = whoamiResponse;
    expect(body).toHaveProperty('email', TEST_EMAIL);
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('hashedPassword');
  });
});
