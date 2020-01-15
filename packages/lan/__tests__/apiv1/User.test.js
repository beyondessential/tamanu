import { getTestContext } from '../utilities';

const app = getTestContext();

describe('User', () => {
  describe('auth', () => {
    test.todo('should obtain a valid login token');
    test.todo('should refresh a token');
    test.todo('should not refresh an expired token');

    test.todo('should get the user based on the current token');

    test.todo('should fail to obtain a token for bad credentials');
  });

  it('should create a new user', async () => {
    const result = await app.post('/v1/user').send({
      displayName: 'Test New',
      email: 'test123@user.com',
      password: 'abc',
    });
    expect(result.body.id).not.toBeNull();
    expect(result.body.password).toBeUndefined();
  });

  it('should change a name', async () => {
    const baseResult = await app.post('/v1/user').send({
      displayName: 'Alan',
      email: 'email@user.com',
      password: '123',
    });
    expect(baseResult.body).toHaveProperty('id');
    expect(baseResult.body).toHaveProperty('displayName', 'Alan');
    const id = baseResult.body.id;

    const result = await app.put(`/v1/user/${id}`).send({
      displayName: 'Brian',
    });
    expect(result.body).toHaveProperty('displayName', 'Brian');
    const updatedUser = await app.models.User.findByPk(id);
    expect(updatedUser).toHaveProperty('displayName', 'Brian');
  });

  it('should change a password', async () => {
    const baseResult = await app.post('/v1/user').send({
      displayName: 'Alan',
      email: 'passwordy@user.com',
      password: '123',
    });
    expect(baseResult.body).toHaveProperty('id');
    const id = baseResult.body.id;
    const user = await app.models.User.findByPk(id);
    const oldpw = user.password;
    expect(oldpw).toBeTruthy();

    const result = await app.put(`/v1/user/${id}`).send({
      password: '999',
      displayName: 'Heffo',
    });
    expect(result.body).not.toHaveProperty('password');
    const updatedUser = await app.models.User.findByPk(id);
    expect(updatedUser).toHaveProperty('displayName', 'Heffo');
    expect(updatedUser.password).toBeTruthy();
    expect(updatedUser.password).not.toEqual('999');
    expect(updatedUser.password).not.toEqual(oldpw);
  });

  it('should fail to create a user without an email', async () => {
    const result = await app.post('/v1/user').send({});
    expect(result).toHaveRequestError();
  });

  it('should fail to create a user with a duplicate email', async () => {
    const baseUserResult = await app.post('/v1/user').send({
      displayName: 'Test Dupe',
      email: 'duplicate@user.com',
      password: 'abc',
    });
    expect(baseUserResult.body.id).not.toBeNull();

    const result = await app.post('/v1/user').send({
      displayName: 'Test Dupe II',
      email: 'duplicate@user.com',
      password: 'abc',
    });
    expect(result).toHaveRequestError();
  });
});
