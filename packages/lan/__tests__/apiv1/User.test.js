import { getToken, centralServerLogin } from 'lan/app/middleware/auth';
import { pick } from 'lodash';
import { fake, chance } from 'shared/test-helpers';
import { CentralServerConnection } from '../../app/sync/CentralServerConnection';
import { createTestContext } from '../utilities';
import {
  createDummyEncounter,
} from 'shared/demoData/patients';

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

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    centralServer = ctx.centralServer;
    CentralServerConnection.mockImplementation(() => centralServer);
  });
  afterAll(() => ctx.close());

  describe('auth', () => {
    let authUser = null;
    const rawPassword = 'PASSWORD';
    const localisation = { foo: 'bar' };

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

  });

  describe('Recently viewed patients', () => {

    let user = null;
    let app = null;
    let patients = [];
    
    let viewPatient = async (patient) => {
      const result = await app.post(`/v1/user/recently-viewed-patients/${patient.id}`);
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        userId: user.id,
        patientId: patient.id,
      });
      return result;
    };

    beforeAll(async () => {
      user = await models.User.create(
        createUser({
          role: 'practitioner',
        }),
      );
      
      app = await baseApp.asUser(user);

      const patientCreations = new Array(20).fill(0).map(() => models.Patient.create(fake(models.Patient)));
      patients = await Promise.all(patientCreations);
    });

    beforeEach(async () => {
      await models.UserRecentlyViewedPatient.destroy({
        where: {},
        truncate: true,
      });
    });

    it('should create a new recently viewed patient on first post from user', async () => {
      const [firstPatient] = patients;

      await viewPatient(firstPatient);
      
      const getResult = await app.get('/v1/user/recently-viewed-patients');
      expect(getResult).toHaveSucceeded();
      expect(getResult.body.data).toHaveLength(1);
      expect(getResult.body.count).toBe(1);
    });

    it('should update updatedAt when posting with id of an already recently viewed patient', async () => {      
      const [firstPatient] = patients;

      const result = await viewPatient(firstPatient);
      const result2 = await viewPatient(firstPatient);

      const resultDate = new Date(result.body.updatedAt);
      const result2Date = new Date(result2.body.updatedAt);
      expect(result2Date.getTime()).toBeGreaterThan(resultDate.getTime());
      
      const getResult = await app.get('/v1/user/recently-viewed-patients');
      expect(getResult).toHaveSucceeded();
      expect(getResult.body.data).toHaveLength(1);
      expect(getResult.body.count).toBe(1);
      
      expect(getResult.body.data[0]).toHaveProperty('id', firstPatient.id);

      const getResultDate = new Date(getResult.body.data[0].last_accessed_on);
      expect(getResultDate.getTime()).toBe(result2Date.getTime());
    });

    it('should not include more than 12 recent patients', async () => {
      // first register a view for every patient in the list (>12)
      for (const p of patients) {
        await viewPatient(p);
      }
      
      const result = await app.get('/v1/user/recently-viewed-patients');
      expect(result).toHaveSucceeded();
      expect(result.body.count).toBe(12);
      expect(result.body.data).toHaveLength(12);

      // orders should match
      const resultIds = result.body.data.map(x => x.id);
      const sourceIds = patients.map(x => x.id).reverse().slice(0, 12);
      expect(resultIds).toEqual(sourceIds);
    });

    it('should handle multiple encounters cleanly', async () => {
      const patientsToView = patients.slice(0, 4);

      for (const p of patientsToView) {
        // open a few encounters for each patient
        for (let i = 0; i < 4; ++i) {
          const enc = await models.Encounter.create(
            await createDummyEncounter(models, { 
              patientId: p.id,
              encounterType: 'admission', 
            }),
          );

          // close some of them but not all
          if (i >= 2) {
            await enc.update({ endDate: new Date() });
          }
        }
      }

      for (const p of patientsToView) {
        await viewPatient(p);
        await viewPatient(p);
        await viewPatient(p);
        await viewPatient(p);
      }
      
      const result = await app.get('/v1/user/recently-viewed-patients?encounterType=admission');
      expect(result).toHaveSucceeded();

      // orders should match
      const resultIds = result.body.data.map(x => x.id);
      const sourceIds = patientsToView.map(x => x.id).reverse();
      expect(resultIds).toEqual(sourceIds);
    });

  });

});
