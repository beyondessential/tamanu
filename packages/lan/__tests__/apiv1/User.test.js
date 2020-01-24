import { createTestContext } from '../utilities';
import { getToken } from 'lan/app/controllers/auth/middleware';

const { baseApp, models } = createTestContext();

describe('User', () => {
  let adminUser = null;
  let adminApp = null;

  beforeAll(async () => {
    adminUser = await models.User.create({
      email: 'admin@test.com',
      displayName: 'Test',
      password: 'admin',
    });

    adminApp = await baseApp.asUser(adminUser);
  });

  describe('auth', () => {
    let authUser = null;
    const rawPassword = 'PASSWORD';

    beforeAll(async () => {
      authUser = await models.User.create({
        email: 'test@test.com',
        displayName: 'Test',
        password: rawPassword,
      });
    });

    it('should obtain a valid login token', async () => {
      const result = await baseApp.post('/v1/login').send({
        email: authUser.email,
        password: rawPassword,
      });
      expect(result).not.toHaveRequestError();
      expect(result.body).toHaveProperty('token');
    });

    test.todo('should refresh a token');
    test.todo('should not refresh an expired token');

    it('should get the user based on the current token', async () => {
      const userAgent = await baseApp.asUser(authUser);
      const result = await userAgent.get('/v1/user/me');
      expect(result).not.toHaveRequestError();
      expect(result.body).toHaveProperty('id', authUser.id);
    });

    it('should fail to get the user with a null token', async () => {
      const result = await baseApp.get('/v1/user/me');
      expect(result).toHaveRequestError();
    });

    it('should fail to get the user with an expired token', async () => {
      const expiredToken = await getToken(authUser, '-1s');
      const result = await baseApp.get('/v1/user/me')
        .set('authorization', `Bearer ${expiredToken}`);
      expect(result).toHaveRequestError();
    });

    it('should fail to get the user with an invalid token', async () => {
      const result = await baseApp
        .get('/v1/user/me')
        .set('authorization', 'Bearer ABC_not_a_valid_token');
      expect(result).toHaveRequestError();
    });

    it('should fail to obtain a token for a wrong password', async () => {
      const result = await baseApp.post('/v1/login').send({
        email: authUser.email,
        password: 'PASSWARD',
      });
      expect(result).toHaveRequestError();
    });

    it('should fail to obtain a token for a wrong email', async () => {
      const result = await baseApp.post('/v1/login').send({
        email: 'test@toast.com',
        password: rawPassword,
      });
      expect(result).toHaveRequestError();
    });
  });

  it('should create a new user', async () => {
    const result = await adminApp.post('/v1/user').send({
      displayName: 'Test New',
      email: 'test123@user.com',
      password: 'abc',
    });
    expect(result).not.toHaveRequestError();

    const { id, password } = result.body;
    expect(id).not.toBeNull();
    expect(password).toBeUndefined();

    const createdUser = await models.User.findByPk(id);
    expect(createdUser).toHaveProperty('displayName', 'Test New');
    expect(createdUser).not.toHaveProperty('password', 'abc');
  });

  it('should change a name', async () => {
    const baseResult = await adminApp.post('/v1/user').send({
      displayName: 'Alan',
      email: 'email@user.com',
      password: '123',
    });
    expect(baseResult).not.toHaveRequestError();
    expect(baseResult.body).toHaveProperty('id');
    expect(baseResult.body).toHaveProperty('displayName', 'Alan');
    const id = baseResult.body.id;

    const result = await adminApp.put(`/v1/user/${id}`).send({
      displayName: 'Brian',
    });
    expect(result).not.toHaveRequestError();
    expect(result.body).toHaveProperty('displayName', 'Brian');
    const updatedUser = await models.User.findByPk(id);
    expect(updatedUser).toHaveProperty('displayName', 'Brian');
  });

  it('should change a password', async () => {
    const baseResult = await adminApp.post('/v1/user').send({
      displayName: 'Alan',
      email: 'passwordy@user.com',
      password: '123',
    });
    expect(baseResult).not.toHaveRequestError();
    expect(baseResult.body).toHaveProperty('id');
    const id = baseResult.body.id;
    const user = await models.User.findByPk(id);
    const oldpw = user.password;
    expect(oldpw).toBeTruthy();
    expect(oldpw).not.toEqual('123');

    const result = await adminApp.put(`/v1/user/${id}`).send({
      password: '999',
      displayName: 'Brian',
    });
    expect(result).not.toHaveRequestError();
    expect(result.body).not.toHaveProperty('password');
    const updatedUser = await models.User.findByPk(id);
    expect(updatedUser).toHaveProperty('displayName', 'Brian');
    expect(updatedUser.password).toBeTruthy();
    expect(updatedUser.password).not.toEqual('999');
    expect(updatedUser.password).not.toEqual(oldpw);
  });

  it('should fail to create a user without an email', async () => {
    const result = await adminApp.post('/v1/user').send({});
    expect(result).toHaveRequestError();
  });

  it('should fail to create a user with a duplicate email', async () => {
    const baseUserResult = await adminApp.post('/v1/user').send({
      displayName: 'Test Dupe',
      email: 'duplicate@user.com',
      password: 'abc',
    });
    expect(baseUserResult.body.id).not.toBeNull();

    const result = await adminApp.post('/v1/user').send({
      displayName: 'Test Dupe II',
      email: 'duplicate@user.com',
      password: 'abc',
    });
    expect(result).toHaveRequestError();
  });
});
