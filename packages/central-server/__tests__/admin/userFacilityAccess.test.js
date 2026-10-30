import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CAN_ACCESS_ALL_FACILITIES, VISIBILITY_STATUSES } from '@tamanu/constants';
import { fake } from '@tamanu/fake-data/fake';
import {
  setHardcodedPermissionsUseForTestsOnly,
  unsetUseHardcodedPermissionsUseForTestsOnly,
} from '@tamanu/shared/permissions/rolesToPermissions';
import { createTestContext } from '../utilities';

const ACCESS_SETTINGS = [
  { restrictUsersToFacilities: false, useHardcodedPermissions: false },
  { restrictUsersToFacilities: true, useHardcodedPermissions: false },
  { restrictUsersToFacilities: false, useHardcodedPermissions: true },
  { restrictUsersToFacilities: true, useHardcodedPermissions: true },
];

// spec: USRPRF#facility-access
describe('User profiles facility access', () => {
  let ctx;
  let models;
  let adminApp;
  let roleWithoutLogin;
  let plainFacility;
  let otherPlainFacility;
  let sensitiveFacility;
  const users = {};

  const createUser = async (role, linkedFacilities = [], overrides = {}) => {
    const { User, UserFacility } = models;
    const user = await User.create(fake(User, { role, ...overrides }));
    for (const facility of linkedFacilities) {
      await UserFacility.create({ userId: user.id, facilityId: facility.id });
    }
    return user;
  };

  const applyAccessSettings = async ({ restrictUsersToFacilities, useHardcodedPermissions }) => {
    await models.Setting.set('auth.restrictUsersToFacilities', restrictUsersToFacilities);
    setHardcodedPermissionsUseForTestsOnly(useHardcodedPermissions);
  };

  const listUsers = async query => {
    const response = await adminApp.get('/api/admin/users').query(query);
    expect(response).toHaveSucceeded();
    return response.body;
  };

  const isTestUser = ({ id }) => Object.values(users).some(user => user.id === id);

  const listedTestUserIds = async query => {
    const { data } = await listUsers(query);
    return data
      .filter(isTestUser)
      .map(({ id }) => id)
      .sort();
  };

  const facilityColumn = async () => {
    const { data } = await listUsers({});
    return Object.fromEntries(
      data.filter(isTestUser).map(({ id, allowedFacilities }) => [id, allowedFacilities]),
    );
  };

  const facilityIds = allowedFacilities =>
    allowedFacilities === CAN_ACCESS_ALL_FACILITIES
      ? CAN_ACCESS_ALL_FACILITIES
      : allowedFacilities.map(({ id }) => id).sort();

  const expectFilterToMatchLogin = async facilities => {
    for (const facility of facilities) {
      const expectedUserIds = [];
      for (const user of Object.values(users)) {
        const freshUser = await models.User.findByPk(user.id);
        if (await freshUser.canAccessFacility(facility.id)) expectedUserIds.push(user.id);
      }
      expect(await listedTestUserIds({ facilityId: facility.id })).toEqual(expectedUserIds.sort());
    }
  };

  beforeAll(async () => {
    ctx = await createTestContext();
    models = ctx.store.models;
    adminApp = await ctx.baseApp.asRole('admin');
    const { Facility, Permission, Role } = models;

    plainFacility = await Facility.create(fake(Facility));
    otherPlainFacility = await Facility.create(fake(Facility));

    roleWithoutLogin = await Role.create(fake(Role));
    const roleWithLogin = await Role.create(fake(Role));
    const roleWithScopedLogin = await Role.create(fake(Role));
    await Permission.create({ roleId: roleWithLogin.id, verb: 'login', noun: 'Facility' });
    await Permission.create({
      roleId: roleWithScopedLogin.id,
      verb: 'login',
      noun: 'Facility',
      objectId: plainFacility.id,
    });

    users.superuser = await createUser('admin');
    users.linkedToPlain = await createUser(roleWithoutLogin.id, [plainFacility]);
    users.withLogin = await createUser(roleWithLogin.id);
    users.withScopedLogin = await createUser(roleWithScopedLogin.id);
    users.withoutAccess = await createUser(roleWithoutLogin.id);
    users.deactivated = await createUser(roleWithoutLogin.id, [otherPlainFacility], {
      visibilityStatus: VISIBILITY_STATUSES.HISTORICAL,
    });
    users.withRemovedLink = await createUser(roleWithoutLogin.id, [otherPlainFacility]);
    await models.UserFacility.destroy({ where: { userId: users.withRemovedLink.id } });
  });

  afterAll(async () => {
    await models.Setting.set('auth.restrictUsersToFacilities', false);
    unsetUseHardcodedPermissionsUseForTestsOnly();
    await ctx.close();
  });

  describe('with no sensitive facilities', () => {
    it.each(ACCESS_SETTINGS)('filters by facility exactly as login allows (%o)', async settings => {
      await applyAccessSettings(settings);
      await expectFilterToMatchLogin([plainFacility, otherPlainFacility]);
    });

    // spec: USRPRF#facility-column
    it('shows all facilities, linked facilities, or none', async () => {
      await applyAccessSettings({ restrictUsersToFacilities: true, useHardcodedPermissions: false });
      const column = await facilityColumn();
      expect(column[users.superuser.id]).toBe(CAN_ACCESS_ALL_FACILITIES);
      expect(column[users.withLogin.id]).toBe(CAN_ACCESS_ALL_FACILITIES);
      // A login permission scoped to one facility grants every non-sensitive facility, as at login
      expect(column[users.withScopedLogin.id]).toBe(CAN_ACCESS_ALL_FACILITIES);
      expect(column[users.linkedToPlain.id]).toEqual([
        { id: plainFacility.id, name: plainFacility.name },
      ]);
      expect(column[users.withoutAccess.id]).toEqual([]);
      expect(column[users.withRemovedLink.id]).toEqual([]);
    });

    it('lists every user when facility restriction is off', async () => {
      await applyAccessSettings({ restrictUsersToFacilities: false, useHardcodedPermissions: false });
      const allTestUserIds = Object.values(users)
        .map(({ id }) => id)
        .sort();
      expect(await listedTestUserIds({ facilityId: plainFacility.id })).toEqual(allTestUserIds);
    });

    it('counts and pages the filtered users', async () => {
      await applyAccessSettings({ restrictUsersToFacilities: true, useHardcodedPermissions: false });
      const allMatches = await listUsers({ facilityId: plainFacility.id });
      expect(allMatches.count).toBe(allMatches.data.length);

      const firstPage = await listUsers({ facilityId: plainFacility.id, rowsPerPage: 1, page: 0 });
      expect(firstPage.count).toBe(allMatches.count);
      expect(firstPage.data).toHaveLength(1);
    });

    it('shows a deactivated user their facility access, and filters them with the others', async () => {
      await applyAccessSettings({ restrictUsersToFacilities: true, useHardcodedPermissions: false });
      const column = await facilityColumn();
      expect(column[users.deactivated.id]).toEqual([
        { id: otherPlainFacility.id, name: otherPlainFacility.name },
      ]);

      expect(await listedTestUserIds({ facilityId: otherPlainFacility.id })).toContain(
        users.deactivated.id,
      );
      expect(
        await listedTestUserIds({ facilityId: otherPlainFacility.id, includeDeactivated: false }),
      ).not.toContain(users.deactivated.id);
    });
  });

  describe('with a sensitive facility', () => {
    beforeAll(async () => {
      const { Facility, SensitiveNetwork } = models;
      const network = await SensitiveNetwork.create(fake(SensitiveNetwork));
      sensitiveFacility = await Facility.create(
        fake(Facility, { sensitiveNetworkId: network.id }),
      );
      users.linkedToSensitive = await createUser(roleWithoutLogin.id, [sensitiveFacility]);
    });

    it.each(ACCESS_SETTINGS)('filters by facility exactly as login allows (%o)', async settings => {
      await applyAccessSettings(settings);
      await expectFilterToMatchLogin([plainFacility, otherPlainFacility, sensitiveFacility]);
    });

    it('reaches a sensitive facility only through superusers and links', async () => {
      await applyAccessSettings({ restrictUsersToFacilities: false, useHardcodedPermissions: false });
      expect(await listedTestUserIds({ facilityId: sensitiveFacility.id })).toEqual(
        [users.superuser.id, users.linkedToSensitive.id].sort(),
      );
    });

    // spec: USRPRF#facility-column
    it('lists non-sensitive facilities for users who may access them all', async () => {
      await applyAccessSettings({ restrictUsersToFacilities: true, useHardcodedPermissions: false });
      const column = await facilityColumn();
      expect(column[users.superuser.id]).toBe(CAN_ACCESS_ALL_FACILITIES);

      const loginUserFacilityIds = facilityIds(column[users.withLogin.id]);
      expect(loginUserFacilityIds).toEqual(
        expect.arrayContaining([plainFacility.id, otherPlainFacility.id]),
      );
      expect(loginUserFacilityIds).not.toContain(sensitiveFacility.id);

      expect(facilityIds(column[users.linkedToSensitive.id])).toEqual([sensitiveFacility.id]);
    });
  });
});
