import { getToken, centralServerLogin } from 'lan/app/middleware/auth';
import { pick } from 'lodash';
import { fake, chance } from 'shared/test-helpers';
import { CentralServerConnection } from '../../app/sync/CentralServerConnection';
import { createTestContext, disableHardcodedPermissionsForSuite } from '../utilities';

const createUser = overrides => ({
  email: chance.email(),
  displayName: chance.name(),
  password: chance.word(),
  ...overrides,
});

// N.B. there were formerly a well written extra suite of tests here for functionality like creating
// users and changing passwords, which is functionality that isn't supported on the facility server
// If reimplementing the same functionality on the facility or central server, see this file at
// commit 51f66c9
describe('User', () => {
  let baseApp = null;
  let models = null;
  let centralServer = null;
  let ctx;
  const rawPassword = 'PASSWORD';
  const localisation = { foo: 'bar' };
  let authUser = null;

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    centralServer = ctx.centralServer;
    CentralServerConnection.mockImplementation(() => centralServer);
  });
  afterAll(() => ctx.close());

  describe('auth with db-defined permissions', () => {
    disableHardcodedPermissionsForSuite();
    let authRole = null;

    beforeAll(async () => {
      const { User, Role } = models;
      authRole = await Role.create(fake(Role));
      authUser = await User.create(fake(User, { password: rawPassword, role: authRole.id }));
    });

    it('should include role in the data returned by a successful login', async () => {
      const result = await baseApp.post('/v1/login').send({
        email: authUser.email,
        password: rawPassword,
      });
      expect(result).toHaveSucceeded();
      expect(result.body.role).toMatchObject({
        id: authRole.id,
        name: authRole.name,
      });
    });
  });

  // TODO: move to db-defined permissions
  describe('auth', () => {
    beforeAll(async () => {
      authUser = await models.User.create(
        createUser({
          password: rawPassword,
        }),
      );
      await models.UserLocalisationCache.create({
        userId: authUser.id,
        localisation: JSON.stringify(localisation),
      });
    });

    it('should obtain a valid login token', async () => {
      const result = await baseApp.post('/v1/login').send({
        email: authUser.email,
        password: rawPassword,
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('token');
    });

    test.todo('should refresh a token');
    test.todo('should not refresh an expired token');

    it('should get the user based on the current token', async () => {
      const userAgent = await baseApp.asUser(authUser);
      const result = await userAgent.get('/v1/user/me');
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('id', authUser.id);
    });

    it('should fail to get the user with a null token', async () => {
      const result = await baseApp.get('/v1/user/me');
      expect(result).toHaveRequestError();
    });

    it('should fail to get the user with an expired token', async () => {
      const expiredToken = await getToken(authUser, '-1s');
      const result = await baseApp
        .get('/v1/user/me')
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

    it('should return cached feature flags in the login request', async () => {
      const result = await baseApp.post('/v1/login').send({
        email: authUser.email,
        password: rawPassword,
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('localisation');
      expect(result.body.localisation).toEqual(localisation);
    });

    it('should pass feature flags through from a central server login request', async () => {
      centralServer.fetch.mockResolvedValueOnce({
        user: pick(authUser, ['id', 'role', 'email', 'displayName']),
        localisation,
      });
      const result = await centralServerLogin(models, authUser.email, rawPassword);
      expect(result).toHaveProperty('localisation', localisation);
      const cache = await models.UserLocalisationCache.findOne({
        where: {
          userId: authUser.id,
        },
        raw: true,
      });
      expect(cache).toMatchObject({
        localisation: JSON.stringify(localisation),
      });
    });

    it('should include permissions in the data returned by a successful login', async () => {
      const result = await baseApp.post('/v1/login').send({
        email: authUser.email,
        password: rawPassword,
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('permissions');
    });

    it('should create a new recently viewed patient on first post from user', async () => {
      await models.UserRecentlyViewedPatient.destroy({
        where: {},
        truncate: true,
      });
      await authUser.update({
        role: 'practitioner',
      });
      const userAgent = await baseApp.asUser(authUser);
      const newPatient = await models.Patient.create({
        ...fake(models.Patient),
      });
      const postResult = await userAgent.post(`/v1/user/recently-viewed-patients/${newPatient.id}`);
      expect(postResult).toHaveSucceeded();
      expect(postResult.body).toHaveProperty('userId', authUser.id);
      expect(postResult.body).toHaveProperty('patientId', newPatient.id);
      const getResult = await userAgent.get('/v1/user/recently-viewed-patients');
      expect(getResult).toHaveSucceeded();
      expect(getResult.body.data).toHaveLength(1);
      expect(getResult.body.count).toBe(1);
    });

    it('should update updatedAt when posting with id of an already recently viewed patient', async () => {
      await models.UserRecentlyViewedPatient.destroy({
        where: {},
        truncate: true,
      });
      await authUser.update({
        role: 'practitioner',
      });
      const userAgent = await baseApp.asUser(authUser);
      const newPatient = await models.Patient.create({
        ...fake(models.Patient),
      });
      const result = await userAgent.post(`/v1/user/recently-viewed-patients/${newPatient.id}`);
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('userId', authUser.id);
      expect(result.body).toHaveProperty('patientId', newPatient.id);
      const result2 = await userAgent.post(`/v1/user/recently-viewed-patients/${newPatient.id}`);
      expect(result2).toHaveSucceeded();
      expect(result2.body).toHaveProperty('userId', authUser.id);
      expect(result2.body).toHaveProperty('patientId', newPatient.id);
      const resultDate = new Date(result.body.updatedAt);
      const result2Date = new Date(result2.body.updatedAt);
      expect(result2Date.getTime()).toBeGreaterThan(resultDate.getTime());
      const getResult = await userAgent.get('/v1/user/recently-viewed-patients');
      expect(getResult).toHaveSucceeded();
      expect(getResult.body.data).toHaveLength(1);
      expect(getResult.body.count).toBe(1);
      const getResultDate = new Date(getResult.body.data[0].last_accessed_on);
      expect(getResultDate.getTime()).toBe(result2Date.getTime());
    });
  });
});
