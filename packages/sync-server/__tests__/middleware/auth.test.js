import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';
import { createTestContext } from '../utilities';

const TEST_EMAIL = 'test@beyondessential.com.au';
const TEST_PASSWORD = '1Q2Q3Q4Q';
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
];

describe('Auth', () => {
  let baseApp;
  let app;
  let store;
  let close;
  let emailService;
  beforeAll(async () => {
    const ctx = await createTestContext();
    baseApp = ctx.baseApp;
    close = ctx.close;
    store = ctx.store;
    emailService = ctx.emailService;
    app = await baseApp.asRole('practitioner');

    await Promise.all([
      ...USERS.map(r => ctx.store.models.User.create(r)),
      ctx.store.models.Facility.create(TEST_FACILITY),
    ]);
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
    const USER_ID = 'user-management';
    const DISPLAY_NAME = 'John Jones';
    const USER_PASSWORD = 'abc_123';
    const USER_PASSWORD_2 = 'abc_1234';

    it('Should hash a password for a user synced through the api', async () => {
      const response = await app.post('/v1/sync/user').send({
        data: {
          id: USER_ID,
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
        facilityId: TEST_FACILITY.id,
      });
      expect(loginResponse).toHaveSucceeded();
      expect(loginResponse.body).toEqual({
        token: expect.any(String),
        user: {
          id: USER_ID,
          email: USER_EMAIL,
          displayName: DISPLAY_NAME,
          role: 'practitioner',
        },
        localisation: expect.any(Object),
        permissions: expect.any(Object),
        facility: expect.objectContaining(TEST_FACILITY),
        centralHost: expect.any(String),
      });
    });

    it('Should hash an updated password for an existing user', async () => {
      const response = await app.post('/v1/sync/user').send({
        data: {
          id: USER_ID,
          password: USER_PASSWORD_2,
          displayName: DISPLAY_NAME,
        },
      });
      expect(response).toHaveSucceeded();

      const savedUser = await store.findUser(USER_EMAIL);
      expect(savedUser).toHaveProperty('password');
      expect(savedUser).toHaveProperty('displayName', DISPLAY_NAME);
      expect(savedUser.password.slice(0, 2)).toBe('$2'); // magic number for bcrypt hashes

      // succeed login with new password
      const loginResponse = await baseApp.post('/v1/login').send({
        email: USER_EMAIL,
        password: USER_PASSWORD_2,
      });
      expect(loginResponse).toHaveSucceeded();

      // fail login with old password
      const loginResponse2 = await baseApp.post('/v1/login').send({
        email: USER_EMAIL,
        password: USER_PASSWORD,
      });
      expect(loginResponse2).toHaveRequestError();
    });

    it('Should include a new user in the GET /sync/user channel', async () => {
      const now = new Date().valueOf();
      const newEmail = 'new-user-get@test.tamanu.io';
      const displayName = 'test-new';

      const response = await app.post('/v1/sync/user').send({
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

      const response = await app.post('/v1/sync/user').send({
        recordType: 'user',
        data: {
          id: USER_ID,
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

  it('Should send permissions alongside login information', async () => {
    const response = await baseApp.post('/v1/login').send({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    expect(response).toHaveSucceeded();
    expect(response.body).toHaveProperty('permissions');
  });

  describe('Change password', () => {
    describe('Creating a one-time login', () => {
      it('Should create a one-time login for a password reset request', async () => {
        const response = await baseApp.post('/v1/resetPassword').send({
          email: TEST_EMAIL,
        });

        const otl = await store.models.OneTimeLogin.findOne({
          include: [
            {
              association: 'user',
              where: { email: TEST_EMAIL },
            },
          ],
        });

        expect(response).toHaveSucceeded();
        expect(otl).toHaveProperty('token', expect.any(String));
        expect(otl).toHaveProperty('user.email', TEST_EMAIL);
      });

      it('Should email the user a one-time login', async () => {
        await baseApp.post('/v1/resetPassword').send({
          email: TEST_EMAIL,
        });
        const email = emailService.sendEmail.mock.calls[0][0].text;
        const token = email.match(/Reset Code: (.*)\n/)[1];
        expect(token).toEqual(expect.any(String));
      });
    });

    describe('Consuming a one-time login', () => {
      let userId;
      beforeAll(async () => {
        const user = await store.models.User.findOne({
          where: { email: TEST_EMAIL },
        });
        userId = user.id;
      });

      it('Should consume a one-time login and reset a password', async () => {
        const token = uuid();
        const newPassword = uuid();

        await store.models.OneTimeLogin.create({ userId, token, expiresAt: new Date(2077, 1, 1) });

        const response = await baseApp.post('/v1/changePassword').send({
          email: TEST_EMAIL,
          newPassword,
          token,
        });

        // expect a successful response
        expect(response).toHaveSucceeded();

        // expect a matching hashed password
        const dbUser = await store.models.User.scope('withPassword').findByPk(userId);
        const user = dbUser.get({ plain: true });
        expect(user).toHaveProperty('password', expect.any(String));
        expect(await bcrypt.compare(newPassword, user.password)).toEqual(true);

        // expect the token to be used
        const dbOtl = await store.models.OneTimeLogin.findOne({ where: { token } });
        const otl = dbOtl.get({ plain: true });
        expect(otl).toHaveProperty('usedAt', expect.any(Date));
      });

      it('Should reject a password reset if no one-time login exists', async () => {
        const response = await baseApp.post('/v1/changePassword').send({
          email: TEST_EMAIL,
          newPassword: uuid(),
          token: uuid(),
        });
        expect(response).not.toHaveSucceeded();
      });

      it('Should reject a password reset if the OTL is consumed', async () => {
        const token = uuid();
        const newPassword = uuid();

        await store.models.OneTimeLogin.create({
          userId,
          token,
          expiresAt: new Date(2077, 1, 1),
          usedAt: new Date(2000, 1, 1),
        });

        const response = await baseApp.post('/v1/changePassword').send({
          email: TEST_EMAIL,
          newPassword,
          token,
        });

        expect(response).not.toHaveSucceeded();
      });

      it('Should reject a password reset if the OTL is expired', async () => {
        const token = uuid();
        const newPassword = uuid();

        await store.models.OneTimeLogin.create({
          userId,
          token,
          expiresAt: new Date(2000, 1, 1),
        });

        const response = await baseApp.post('/v1/changePassword').send({
          email: TEST_EMAIL,
          newPassword,
          token,
        });

        expect(response).not.toHaveSucceeded();
      });
    });
  });
});
