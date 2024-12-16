import { CAN_ACCESS_ALL_FACILITIES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { pick } from 'lodash';
import { chance, disableHardcodedPermissionsForSuite, fake } from '@tamanu/shared/test-helpers';
import { addHours } from 'date-fns';
import { createDummyEncounter } from '@tamanu/shared/demoData/patients';

import { centralServerLogin, buildToken, comparePassword } from '../../dist/middleware/auth';
import { CentralServerConnection } from '../../dist/sync/CentralServerConnection';
import { createTestContext } from '../utilities';

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
  let deactivatedUser = null;

  const facility1 = { id: 'balwyn', name: 'Balwyn' };
  const facility2 = { id: 'kerang', name: 'Kerang' };
  const facility3 = { id: 'lake-charm', name: 'Lake Charm' };
  const configFacilities = [facility1, facility2, facility3];
  const configFacilityIds = configFacilities.map(f => f.id);

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
      await models.Setting.set('auth.restrictUsersToFacilities', true);
      authRole = await Role.create(fake(Role));
      authUser = await User.create(fake(User, { password: rawPassword, role: authRole.id }));
      deactivatedUser = await User.create(
        fake(User, {
          password: rawPassword,
          role: authRole.id,
          visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
        }),
      );
      await models.UserFacility.create({
        facilityId: facility1.id,
        userId: authUser.id,
      });
    });

    it('should include role in the data returned by a successful login', async () => {
      const result = await baseApp.post('/api/login').send({
        email: authUser.email,
        password: rawPassword,
      });
      expect(result).toHaveSucceeded();
      expect(result.body.role).toMatchObject({
        id: authRole.id,
        name: authRole.name,
      });
    });

    it('should return available facilities in data returned by successful login', async () => {
      const result = await baseApp.post('/api/login').send({
        email: authUser.email,
        password: rawPassword,
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('availableFacilities');
      expect(result.body.availableFacilities).toStrictEqual([facility1]);
    });

    it('should succeed if setting a facilitiy with permission', async () => {
      const userAgent = await baseApp.asUser(authUser);
      const validFacilityResult = await userAgent.post('/api/setFacility').send({
        facilityId: facility1.id,
      });
      expect(validFacilityResult).toHaveSucceeded();
    });

    it('should throw error if trying to set a facilitiy without permission', async () => {
      const userAgent = await baseApp.asUser(authUser);
      const validFacilityResult = await userAgent.post('/api/setFacility').send({
        facilityId: facility2.id,
      });
      expect(validFacilityResult).toHaveRequestError();
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
      await models.UserFacility.create({
        facilityId: facility1.id,
        userId: authUser.id,
      });
    });

    describe('logins', () => {
      it('should obtain a valid login token', async () => {
        const result = await baseApp.post('/api/login').send({
          email: authUser.email,
          password: rawPassword,
        });
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('token');
      });

      it('should be case insensitive', async () => {
        const result = await baseApp.post('/api/login').send({
          email: authUser.email.toUpperCase(),
          password: rawPassword,
        });
        expect(result).toHaveSucceeded();
      });

      it('should fail to obtain a token for a wrong password', async () => {
        const result = await baseApp.post('/api/login').send({
          email: authUser.email,
          password: 'PASSWARD',
        });
        expect(result).toHaveRequestError();
      });

      it('should fail to obtain a token for a wrong email', async () => {
        const result = await baseApp.post('/api/login').send({
          email: 'test@toast.com',
          password: rawPassword,
        });
        expect(result).toHaveRequestError();
      });

      it('should return cached feature flags in the login request', async () => {
        const result = await baseApp.post('/api/login').send({
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
        const result = await baseApp.post('/api/login').send({
          email: authUser.email,
          password: rawPassword,
        });
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('permissions');
      });

      describe('Rejected logins', () => {
        it('should fail to obtain a token for a wrong password', async () => {
          const result = await baseApp.post('/api/login').send({
            email: authUser.email,
            password: 'PASSWARD',
          });
          expect(result).toHaveRequestError();
        });

        it('should fail to obtain a token for a wrong email', async () => {
          const result = await baseApp.post('/api/login').send({
            email: 'test@toast.com',
            password: rawPassword,
          });
          expect(result).toHaveRequestError();
        });

        it('should fail to obtain a token for a deactivated user', async () => {
          const result = await baseApp.post('/api/login').send({
            email: deactivatedUser.email,
            password: rawPassword,
          });
          expect(result).toHaveRequestError();
        });
      });
    });

    describe('tokens', () => {
      test.todo('should refresh a token');
      test.todo('should not refresh an expired token');

      it('should get the user based on the current token', async () => {
        const userAgent = await baseApp.asUser(authUser);
        const result = await userAgent.get('/api/user/me');
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('id', authUser.id);
      });

      it('should fail to get the user with a null token', async () => {
        const result = await baseApp.get('/api/user/me');
        expect(result).toBeForbidden();
      });

      it('should fail to get the user with an expired token', async () => {
        const expiredToken = await buildToken(authUser, null, '-1s');
        const result = await baseApp
          .get('/api/user/me')
          .set('authorization', `Bearer ${expiredToken}`);
        expect(result).toHaveRequestError();
      });

      it('should fail to get the user with an invalid token', async () => {
        const result = await baseApp
          .get('/api/user/me')
          .set('authorization', 'Bearer ABC_not_a_valid_token');
        expect(result).toHaveRequestError();
      });

      describe('Rejected tokens', () => {
        it('should get the user based on the current token', async () => {
          const userAgent = await baseApp.asUser(authUser);
          const result = await userAgent.get('/api/user/me');
          expect(result).toHaveSucceeded();
          expect(result.body).toHaveProperty('id', authUser.id);
        });

        it('should fail to get the user with an expired token', async () => {
          const expiredToken = await buildToken(authUser, null, '-1s');
          const result = await baseApp
            .get('/api/user/me')
            .set('authorization', `Bearer ${expiredToken}`);
          expect(result).toHaveRequestError();
        });

        it('should fail to get the user with an invalid token', async () => {
          const result = await baseApp
            .get('/api/user/me')
            .set('authorization', 'Bearer ABC_not_a_valid_token');
          expect(result).toHaveRequestError();
        });

        it('should fail to get a deactivated user with a valid token', async () => {
          const userAgent = await baseApp.asUser(deactivatedUser);
          const result = await userAgent.get('/api/user/me');
          expect(result).toHaveRequestError();
        });
      });
    });

    describe('change password', () => {
      let chPwUser;
      let chPwApp;
      beforeEach(async () => {
        chPwUser = await models.User.create(
          createUser({
            password: rawPassword,
          }),
        );
        chPwApp = await baseApp.asUser(chPwUser);
      });
      const doesPwMatch = async pw => {
        const user = await models.User.scope('withPassword').findByPk(chPwUser.id);
        return comparePassword(user, pw);
      };

      it('succeeds if the central succeeds', async () => {
        centralServer.forwardRequest.mockResolvedValueOnce({ ok: 'ok' });
        const newPassword = `${rawPassword}_central_success`;
        const result = await chPwApp.post('/api/changePassword').send({
          email: chPwUser.email,
          newPassword,
          token: "this doesn't matter here",
        });
        expect(result).toHaveSucceeded();
        expect(await doesPwMatch(newPassword)).toBe(true);
      });

      it('fails if the central fails', async () => {
        centralServer.forwardRequest.mockRejectedValueOnce(new Error('not a real error'));
        const newPassword = `${rawPassword}_central_failure`;
        const result = await chPwApp.post('/api/changePassword').send({
          email: chPwUser.email,
          newPassword,
          token: "this doesn't matter here",
        });
        expect(result).not.toHaveSucceeded();
        expect(await doesPwMatch(newPassword)).toBe(false);
      });

      it('looks up emails case insensitively', async () => {
        centralServer.forwardRequest.mockResolvedValueOnce({ ok: 'ok' });
        const newPassword = `${rawPassword}_case`;
        const result = await chPwApp.post('/api/changePassword').send({
          email: chPwUser.email.toUpperCase(),
          newPassword,
          token: "this doesn't matter here",
        });
        expect(result).toHaveSucceeded();
        expect(await doesPwMatch(newPassword)).toBe(true);
      });
    });
  });

  describe('User facility methods', () => {
    let user = null;
    let superUser = null;
    let noFacilityUser = null;

    const validUserFacilities = [facility1, facility2];
    const validUserFacilityIds = validUserFacilities.map(f => f.id);

    beforeAll(async () => {
      await models.Setting.set('auth.restrictUsersToFacilities', true);
      superUser = await models.User.create(
        createUser({
          role: 'admin',
        }),
      );
      user = await models.User.create(
        createUser({
          role: 'practitioner',
        }),
      );
      noFacilityUser = await models.User.create(
        createUser({
          role: 'practitioner',
        }),
      );

      await Promise.all(
        validUserFacilities.map(async facility => {
          return await models.UserFacility.create({
            facilityId: facility.id,
            userId: user.id,
          });
        }),
      );

      await user.reload({ include: 'facilities' });
    });

    describe('checkCanAccessAllFacilities', () => {
      it('should return true if superuser', async () => {
        expect(await superUser.checkCanAccessAllFacilities()).toBe(true);
      });
      it('should return false if user without  "login", "Facility" permission', async () => {
        expect(await user.checkCanAccessAllFacilities()).toBe(false);
      });
    });

    describe('allowedFacilities', () => {
      it('should get special "ALL" key when superuser', async () => {
        const superUserFacilities = await superUser.allowedFacilities();
        expect(superUserFacilities).toBe(CAN_ACCESS_ALL_FACILITIES);
      });
      it('should return linked facilities from user_facilities table', async () => {
        const userFacilities = await user.allowedFacilities();
        expect(userFacilities).toStrictEqual(validUserFacilities);
      });
      it('should return empty array if no linked facilities', async () => {
        const userFacilities = await noFacilityUser.allowedFacilities();
        expect(userFacilities).toHaveLength(0);
      });
    });

    describe('allowedFacilityIds', () => {
      it('should get special "ALL" key when superuser', async () => {
        jest
          .spyOn(superUser, 'allowedFacilities')
          .mockImplementation(() => CAN_ACCESS_ALL_FACILITIES);
        const superUserFacilityIds = await superUser.allowedFacilityIds();
        expect(superUserFacilityIds).toBe(CAN_ACCESS_ALL_FACILITIES);
      });
      it('should return linked facility ids from user_facilities table', async () => {
        jest.spyOn(user, 'allowedFacilities').mockImplementation(() => validUserFacilities);
        const userFacilityIds = await user.allowedFacilityIds();
        expect(userFacilityIds).toStrictEqual(validUserFacilityIds);
      });
      it('should return empty array if no linked facilities', async () => {
        const userFacilityIds = await noFacilityUser.allowedFacilities();
        expect(userFacilityIds).toHaveLength(0);
      });
    });

    describe('canAccessFacility', () => {
      it('should return true for every facility if superuser', async () => {
        jest
          .spyOn(superUser, 'allowedFacilityIds')
          .mockImplementation(() => CAN_ACCESS_ALL_FACILITIES);
        expect(await superUser.canAccessFacility(facility1.id)).toBe(true);
        expect(await superUser.canAccessFacility(facility2.id)).toBe(true);
        expect(await superUser.canAccessFacility(facility3.id)).toBe(true);
      });

      it('should only return true if valid facility linked through user table', async () => {
        jest.spyOn(user, 'allowedFacilityIds').mockImplementation(() => validUserFacilityIds);
        expect(await user.canAccessFacility(facility1.id)).toBe(true);
        expect(await user.canAccessFacility(facility2.id)).toBe(true);
        expect(await user.canAccessFacility(facility3.id)).toBe(false);
      });

      it('should only always return false if no facility links', async () => {
        jest.spyOn(user, 'allowedFacilityIds').mockImplementation(() => []);
        expect(await user.canAccessFacility(facility1.id)).toBe(false);
        expect(await user.canAccessFacility(facility2.id)).toBe(false);
        expect(await user.canAccessFacility(facility3.id)).toBe(false);
      });
    });

    describe('filterAllowedFacilities', () => {
      it('should return all DB facilities that match facilityIds argument if super user', async () => {
        const superUserAllowedFacilities = await models.User.filterAllowedFacilities(
          CAN_ACCESS_ALL_FACILITIES,
          configFacilityIds,
        );
        expect(superUserAllowedFacilities).toStrictEqual([facility1, facility2, facility3]);
      });

      it('should filter allowed facilities by facilityIds argument if normal user', async () => {
        const userAllowedFacilities = await models.User.filterAllowedFacilities(
          validUserFacilities,
          configFacilityIds,
        );
        expect(userAllowedFacilities).toStrictEqual(validUserFacilities);
      });
    });
  });

  describe('Recently viewed patients', () => {
    let user = null;
    let app = null;
    let patients = [];

    const viewPatient = async patient => {
      const result = await app.post(`/api/user/recently-viewed-patients/${patient.id}`);
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

      const patientCreations = new Array(20)
        .fill(0)
        .map(() => models.Patient.create(fake(models.Patient)));
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

      const getResult = await app.get('/api/user/recently-viewed-patients');
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

      const getResult = await app.get('/api/user/recently-viewed-patients');
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

      const result = await app.get('/api/user/recently-viewed-patients');
      expect(result).toHaveSucceeded();
      expect(result.body.count).toBe(12);
      expect(result.body.data).toHaveLength(12);

      // orders should match
      const resultIds = result.body.data.map(x => x.id);
      const sourceIds = patients
        .map(x => x.id)
        .reverse()
        .slice(0, 12);
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
              current: true,
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
      }

      const result = await app.get('/api/user/recently-viewed-patients?encounterType=admission');
      expect(result).toHaveSucceeded();
      // orders should match
      const resultIds = result.body.data.map(x => x.id);
      const sourceIds = patientsToView.map(x => x.id).reverse();
      expect(resultIds).toEqual(sourceIds);
    });

    it('should handle multiple encounters with same start date', async () => {
      const patientsToView = patients.slice(0, 4);

      for (const p of patientsToView) {
        const startDate = new Date();
        const endDate = addHours(startDate, 1);

        // open a few encounters for each patient
        for (let i = 0; i < 4; ++i) {
          const enc = await models.Encounter.create(
            await createDummyEncounter(models, {
              patientId: p.id,
              encounterType: 'admission',
              startDate,
            }),
          );

          // close some of them but not all
          if (i >= 2) {
            await enc.update({ endDate });
          }
        }
      }

      for (const p of patientsToView) {
        await viewPatient(p);
      }

      const result = await app.get('/api/user/recently-viewed-patients?encounterType=admission');
      expect(result).toHaveSucceeded();

      // orders should match
      const resultIds = result.body.data.map(x => x.id);
      const sourceIds = patientsToView.map(x => x.id).reverse();
      expect(resultIds).toEqual(sourceIds);
    });
  });

  describe('User preference', () => {
    let user = null;
    let facilityA = null;
    let facilityB = null;
    let app = null;

    const defaultPreferences = {
      selectedGraphedVitalsOnFilter: ['data-element-1', 'data-element-2', 'data-element-3'].join(
        ',',
      ),
      outpatientAppointmentFilters: {
        appointmentTypeId: ['appointmentType-other'],
      },
    };

    const updateUserPreferences = async ({ userPreferences, facilityId = null }) => {
      const result = await app
        .post('/api/user/userPreferences')
        .send({ facilityId, ...userPreferences });
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        userId: user.id,
        ...(facilityId ? { facilityId } : null),
        ...userPreferences,
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

      facilityA = await models.Facility.create(fake(models.Facility));
      facilityB = await models.Facility.create(fake(models.Facility));

      await updateUserPreferences({ userPreferences: defaultPreferences });
    });

    it('should fetch current user existing user preference', async () => {
      const result = await app.get(`/api/user/userPreferences/${facilityA.id}`);
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject(defaultPreferences);
    });

    it('should prioritise preferences set by facility than fallback to general', async () => {
      const facilityAOutpatientAppointmentFilters = {
        appointmentTypeId: ['appointmentType-standard'],
      };
      const facilityBOutpatientAppointmentFilters = {
        appointmentTypeId: ['appointmentType-other'],
      };

      await updateUserPreferences({
        userPreferences: {
          outpatientAppointmentFilters: facilityAOutpatientAppointmentFilters,
        },
        facilityId: facilityA.id,
      });

      await updateUserPreferences({
        userPreferences: {
          outpatientAppointmentFilters: facilityBOutpatientAppointmentFilters,
        },
        facilityId: facilityB.id,
      });

      const resultA = await app.get(`/api/user/userPreferences/${facilityA.id}`);
      expect(resultA).toHaveSucceeded();
      expect(resultA.body).toMatchObject({
        ...defaultPreferences,
        outpatientAppointmentFilters: facilityAOutpatientAppointmentFilters,
      });

      const resultB = await app.get(`/api/user/userPreferences/${facilityB.id}`);
      expect(resultB).toHaveSucceeded();
      expect(resultB.body).toMatchObject({
        ...defaultPreferences,
        outpatientAppointmentFilters: facilityBOutpatientAppointmentFilters,
      });
    });

    it('should update current user preference and updatedAt for selected graphed vitals on filter', async () => {
      const newSelectedGraphedVitalsOnFilter = ['data-element-1', 'data-element-2'].join(',');
      const result1 = await app.get('/api/user/userPreferences');
      const result2 = await updateUserPreferences({
        selectedGraphedVitalsOnFilter: newSelectedGraphedVitalsOnFilter,
      });
      const result1Date = new Date(result1.body.updatedAt);
      const result2Date = new Date(result2.body.updatedAt);
      expect(result2Date.getTime()).toBeGreaterThan(result1Date.getTime());
    });
  });
});
