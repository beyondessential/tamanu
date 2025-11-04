import { CAN_ACCESS_ALL_FACILITIES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { pick } from 'lodash';
import { disableHardcodedPermissionsForSuite } from '@tamanu/shared/test-helpers';
import { fake, chance } from '@tamanu/fake-data/fake';

import { addHours } from 'date-fns';
import { createDummyEncounter } from '@tamanu/database/demoData/patients';

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
  const sensitiveFacility1 = { id: 'sensitive', name: 'Sensitive Facility' };
  const sensitiveFacility2 = { id: 'sensitive2', name: 'Sensitive Facility 2' };
  const configFacilities = [
    facility1,
    facility2,
    facility3,
    sensitiveFacility1,
    sensitiveFacility2,
  ];
  const configFacilityIds = configFacilities.map(f => f.id);

  beforeAll(async () => {
    ctx = await createTestContext();
    baseApp = ctx.baseApp;
    models = ctx.models;
    centralServer = ctx.centralServer;
    CentralServerConnection.mockImplementation(() => centralServer);

    // Mock UserLoginAttempt.checkIsUserLockedOut to focus tests here; lockout tests are elsewhere
    jest.spyOn(models.UserLoginAttempt, 'checkIsUserLockedOut').mockResolvedValue({
      isUserLockedOut: false,
      remainingLockout: 0,
    });

    await models.Facility.create(
      fake(models.Facility, { ...sensitiveFacility1, isSensitive: true }),
    );
    await models.Facility.create(
      fake(models.Facility, { ...sensitiveFacility2, isSensitive: true }),
    );
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
        deviceId: 'test-device-id',
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
        deviceId: 'test-device-id',
      });
      expect(result).toHaveSucceeded();
      expect(result.body).toHaveProperty('availableFacilities');
      expect(result.body.availableFacilities).toStrictEqual([facility1]);
    });

    it('should succeed if setting a facility with permission', async () => {
      const userAgent = await baseApp.asUser(authUser);
      const validFacilityResult = await userAgent.post('/api/setFacility').send({
        facilityId: facility1.id,
      });
      expect(validFacilityResult).toHaveSucceeded();
    });

    it('should throw error if trying to set a facility without permission', async () => {
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
          deviceId: 'test-device-id',
        });
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('token');
      });

      it('should be case insensitive', async () => {
        const result = await baseApp.post('/api/login').send({
          email: authUser.email.toUpperCase(),
          password: rawPassword,
          deviceId: 'test-device-id',
        });
        expect(result).toHaveSucceeded();
      });

      it('should fail to obtain a token for a wrong password', async () => {
        const result = await baseApp.post('/api/login').send({
          email: authUser.email,
          password: 'PASSWARD',
          deviceId: 'test-device-id',
        });
        expect(result).toHaveRequestError();
      });

      it('should fail to obtain a token for a wrong email', async () => {
        const result = await baseApp.post('/api/login').send({
          email: 'test@toast.com',
          password: rawPassword,
          deviceId: 'test-device-id',
        });
        expect(result).toHaveRequestError();
      });

      it('should return cached feature flags in the login request', async () => {
        const result = await baseApp.post('/api/login').send({
          email: authUser.email,
          password: rawPassword,
          deviceId: 'test-device-id',
        });
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('localisation');
        expect(result.body.localisation).toEqual(localisation);
      });

      it('should pass feature flags through from a central server login request', async () => {
        centralServer.login.mockResolvedValueOnce({
          user: pick(authUser, ['id', 'role', 'email', 'displayName']),
          localisation,
          allowedFacilities: [],
          token: 'mock-token',
          refreshToken: 'mock-refresh-token',
          permissions: [],
          server: { type: 'central' },
        });
        const result = await centralServerLogin({
          models,
          email: authUser.email,
          password: rawPassword,
        });
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
          deviceId: 'test-device-id',
        });
        expect(result).toHaveSucceeded();
        expect(result.body).toHaveProperty('permissions');
      });

      describe('Rejected logins', () => {
        it('should fail to obtain a token for a wrong password', async () => {
          const result = await baseApp.post('/api/login').send({
            email: authUser.email,
            password: 'PASSWARD',
            deviceId: 'test-device-id',
          });
          expect(result).toHaveRequestError();
        });

        it('should fail to obtain a token for a wrong email', async () => {
          const result = await baseApp.post('/api/login').send({
            email: 'test@toast.com',
            password: rawPassword,
            deviceId: 'test-device-id',
          });
          expect(result).toHaveRequestError();
        });

        it('should fail to obtain a token for a deactivated user', async () => {
          const result = await baseApp.post('/api/login').send({
            email: deactivatedUser.email,
            password: rawPassword,
            deviceId: 'test-device-id',
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
        expect(result).toHaveRequestError();
      });

      it('should fail to get the user with an expired token', async () => {
        const expiredToken = await buildToken({ user: authUser, expiresIn: '-1s' });
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
          const expiredToken = await buildToken({ user: authUser, expiresIn: '-1s' });
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
        return await comparePassword(user, pw);
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
    let superUser = null;
    let userWithFacilities = null;
    let userWithoutFacilities = null;

    const nonSensitiveFacilities = [facility1, facility2, facility3];
    const userAllowedFacilities = [facility1, sensitiveFacility1];

    // Defaults for all of the tests in this block. We override as needed
    beforeEach(async () => {
      await models.Setting.set('auth.restrictUsersToFacilities', true);
    });

    beforeAll(async () => {
      superUser = await models.User.create(
        createUser({
          role: 'admin',
        }),
      );

      userWithFacilities = await models.User.create(
        createUser({
          role: 'practitioner',
        }),
      );

      userWithoutFacilities = await models.User.create(
        createUser({
          role: 'practitioner',
        }),
      );

      await Promise.all(
        userAllowedFacilities.map(async facility => {
          return await models.UserFacility.create({
            facilityId: facility.id,
            userId: userWithFacilities.id,
          });
        }),
      );

      await userWithFacilities.reload({ include: 'facilities' });
    });

    describe('allowedFacilities', () => {
      it('should get special "ALL" key when the user is a superuser', async () => {
        const superUserFacilities = await superUser.allowedFacilities();
        expect(superUserFacilities).toBe(CAN_ACCESS_ALL_FACILITIES);
      });

      it('should return all non-sensitive facilities plus the linked facilities when restrictUsersToFacilities is disabled', async () => {
        await models.Setting.set('auth.restrictUsersToFacilities', false);
        const allowedFacilities = await userWithFacilities.allowedFacilities();

        const expectedCombinedFacilities = [...nonSensitiveFacilities, sensitiveFacility1];
        expect(allowedFacilities).toEqual(expect.arrayContaining(expectedCombinedFacilities));
      });

      it('should return the linked facilities from the user_facilities table when restrictUsersToFacilities is enabled', async () => {
        const allowedFacilities = await userWithFacilities.allowedFacilities();
        expect(allowedFacilities).toStrictEqual(userAllowedFacilities);
      });

      it('should return an empty array if there are no linked facilities when restrictUsersToFacilities is enabled', async () => {
        const allowedFacilities = await userWithoutFacilities.allowedFacilities();
        expect(allowedFacilities).toHaveLength(0);
      });

      it('should return all non-sensitive facilities if there are no linked facilities when restrictUsersToFacilities is disabled', async () => {
        await models.Setting.set('auth.restrictUsersToFacilities', false);
        const allowedFacilities = await userWithoutFacilities.allowedFacilities();
        expect(allowedFacilities).toEqual(expect.arrayContaining(nonSensitiveFacilities));
      });
    });

    describe('allowedFacilityIds', () => {
      it('should get special "ALL" key when the user is a superuser', async () => {
        const superUserFacilityIds = await superUser.allowedFacilityIds();
        expect(superUserFacilityIds).toBe(CAN_ACCESS_ALL_FACILITIES);
      });

      it('should return all non-sensitive facilities plus the linked facilities when restrictUsersToFacilities is disabled', async () => {
        await models.Setting.set('auth.restrictUsersToFacilities', false);
        const allowedFacilityIds = await userWithFacilities.allowedFacilityIds();

        const expectedCombinedFacilities = [...nonSensitiveFacilities, sensitiveFacility1];
        const expectedCombinedFacilityIds = expectedCombinedFacilities.map(f => f.id);
        expect(allowedFacilityIds).toEqual(expect.arrayContaining(expectedCombinedFacilityIds));
      });

      it('should return linked facility ids from the user_facilities table when restrictUsersToFacilities is enabled', async () => {
        const allowedFacilityIds = await userWithFacilities.allowedFacilityIds();

        const userFacilityIds = userAllowedFacilities.map(f => f.id);
        expect(allowedFacilityIds).toStrictEqual(userFacilityIds);
      });

      it('should return an empty array if there are no linked facilities when restrictUsersToFacilities is enabled', async () => {
        const allowedFacilityIds = await userWithoutFacilities.allowedFacilityIds();
        expect(allowedFacilityIds).toHaveLength(0);
      });
      it('should return all non-sensitive facility ids if there are no linked facilities when restrictUsersToFacilities is disabled', async () => {
        await models.Setting.set('auth.restrictUsersToFacilities', false);
        const allowedFacilityIds = await userWithoutFacilities.allowedFacilityIds();

        const nonSensitiveFacilityIds = nonSensitiveFacilities.map(f => f.id);
        expect(allowedFacilityIds).toEqual(expect.arrayContaining(nonSensitiveFacilityIds));
      });
    });

    describe('canAccessFacility', () => {
      it('should return true for every facility if the user is a superuser', async () => {
        expect(await superUser.canAccessFacility(facility1.id)).toBe(true);
        expect(await superUser.canAccessFacility(facility2.id)).toBe(true);
        expect(await superUser.canAccessFacility(facility3.id)).toBe(true);
        expect(await superUser.canAccessFacility(sensitiveFacility1.id)).toBe(true);
        expect(await superUser.canAccessFacility(sensitiveFacility2.id)).toBe(true);
      });

      it('should return true if the user is linked to the facility', async () => {
        expect(await userWithFacilities.canAccessFacility(facility1.id)).toBe(true);
        expect(await userWithFacilities.canAccessFacility(facility2.id)).toBe(false);
        expect(await userWithFacilities.canAccessFacility(facility3.id)).toBe(false);
        expect(await userWithFacilities.canAccessFacility(sensitiveFacility1.id)).toBe(true);
        expect(await userWithFacilities.canAccessFacility(sensitiveFacility2.id)).toBe(false);
      });
    });

    describe('filterAllowedFacilities', () => {
      it('should return all DB facilities that match facilityIds argument if super user', async () => {
        const superUserAllowedFacilities = await models.User.filterAllowedFacilities(
          CAN_ACCESS_ALL_FACILITIES,
          configFacilityIds,
        );
        expect(superUserAllowedFacilities).toStrictEqual([
          facility1,
          facility2,
          facility3,
          sensitiveFacility1,
          sensitiveFacility2,
        ]);
      });

      it('should filter allowed facilities by facilityIds argument if normal user', async () => {
        const allowedFacilities = await models.User.filterAllowedFacilities(
          userAllowedFacilities,
          configFacilityIds,
        );
        expect(allowedFacilities).toStrictEqual(userAllowedFacilities);
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

    const updateUserPreference = async ({ key, value, facilityId }) => {
      const result = await app.post('/api/user/userPreferences').send({ key, value, facilityId });
      expect(result).toHaveSucceeded();
      expect(result.body).toMatchObject({
        id: expect.any(String),
        userId: user.id,
        key,
        value,
        ...(facilityId ? { facilityId } : {}),
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

      await updateUserPreference({
        key: 'selectedGraphedVitalsOnFilter',
        value: defaultPreferences.selectedGraphedVitalsOnFilter,
      });

      await updateUserPreference({
        key: 'outpatientAppointmentFilters',
        value: defaultPreferences.outpatientAppointmentFilters,
      });
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

      await updateUserPreference({
        key: 'outpatientAppointmentFilters',
        value: facilityAOutpatientAppointmentFilters,
        facilityId: facilityA.id,
      });

      await updateUserPreference({
        key: 'outpatientAppointmentFilters',
        value: facilityBOutpatientAppointmentFilters,
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
  });
});
