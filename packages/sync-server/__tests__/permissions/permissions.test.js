import { buildAbilityForTests } from 'shared/permissions/buildAbility';
import {
  getPermissionsForRoles,
  queryPermissionsForRoles,
  getAbilityForUser,
} from 'shared/permissions/rolesToPermissions';
import { permissionCache } from 'shared/permissions/cache';
import { DELETION_STATUSES } from '@tamanu/constants/importable';
import { fake } from 'shared/test-helpers/fake';
import { createTestContext } from '../utilities';

async function getAbilityForRoles(models, roleString) {
  const perms = await queryPermissionsForRoles(models, roleString);
  return buildAbilityForTests(perms);
}

describe('Permissions', () => {
  let ctx;

  const makeRoleWithPermissions = async (roleName, perms) => {
    const role = await ctx.store.models.Role.create({ id: roleName, name: roleName });
    await Promise.all(
      perms.map(p =>
        ctx.store.models.Permission.create({
          roleId: role.id,
          ...p,
        }),
      ),
    );
  };

  beforeAll(async () => {
    ctx = await createTestContext();

    await Promise.all([
      makeRoleWithPermissions('reader', [
        { verb: 'read', noun: 'Patient' },
        { verb: 'run', noun: 'Report', objectId: 'report-allowed' },
        {
          verb: 'run',
          noun: 'Report',
          objectId: 'report-allowed-but-revoked',
          deletionStatus: DELETION_STATUSES.REVOKED,
        },
      ]),
      makeRoleWithPermissions('writer', [{ verb: 'write', noun: 'Patient' }]),
    ]);
  });

  afterAll(() => ctx.close());

  it('should make sure permissions are unique', async () => {
    await expect(
      ctx.store.models.Permission.create({
        roleId: 'writer',
        noun: 'Patient',
        verb: 'write',
      }),
    ).rejects.toThrow('Validation error');
    await expect(
      ctx.store.models.Permission.create({
        roleId: 'reader',
        noun: 'Report',
        verb: 'run',
        objectId: 'report-allowed',
      }),
    ).rejects.toThrow('Validation error');
    await expect(
      ctx.store.models.Permission.create({
        roleId: 'reader',
        noun: 'Report',
        verb: 'run',
        objectId: 'different-report',
      }),
    ).resolves.not.toThrowError();
  });

  describe('Creating permission definition from database', () => {
    it('should read a permission definition object from a series of records', async () => {
      const ability = await getAbilityForRoles(ctx.store.models, 'reader');
      expect(ability.can('read', { type: 'Patient' }));
      expect(ability.cannot('write', { type: 'Patient' }));
      expect(ability.can('run', { type: 'Report', id: 'report-allowed' }));
      expect(ability.cannot('run', { type: 'Report', id: 'report-forbidden' }));
      expect(ability.cannot('run', { type: 'Report', id: 'report-allowed-but-revoked' }));
    });

    it('should read a permission definition object across multiple roles', async () => {
      const ability = await getAbilityForRoles(ctx.store.models, 'reader, writer');
      expect(ability.can('read', { type: 'Patient' }));
      expect(ability.can('write', { type: 'Patient' }));
      expect(ability.can('run', { type: 'Report', id: 'report-allowed' }));
      expect(ability.cannot('run', { type: 'Report', id: 'report-forbidden' }));
      expect(ability.cannot('run', { type: 'Report', id: 'report-allowed-but-revoked' }));
    });
  });

  describe("Reading a user's permissions", () => {
    beforeAll(async () => {
      // While config.auth.useHardcodedPermissions is active, this test will
      // just be receiving that list (and it'd be complicated to work around that)
      // so here we set up a hardcoded-permissions-compatible role so that it'll
      // work either way.
      // We don't really need to test that it's sending the _correct_ permissions,
      // as that's covered by the tests above, so it's fine to just test something
      // roughly indicative here. We just want to be sure that the endpoint exists
      // and is sending data in the expected format.

      await makeRoleWithPermissions('practitioner', [
        { verb: 'write', noun: 'EncounterDiagnosis' },
      ]);
    });

    it('should send the list of permissions for a user', async () => {
      const userApp = await ctx.baseApp.asRole('practitioner');
      const response = await userApp.get('/v1/permissions');
      const { permissions } = response.body;
      expect(permissions.some(x => x.verb === 'write' && x.noun === 'EncounterDiagnosis'));
    });

    it('Should forbid any user without specific permission', async () => {
      const userApp = await ctx.baseApp.asRole('reception');
      const ability = await getAbilityForUser(ctx.store.models, userApp.user);
      const hasPermission = ability.can('fakeVerb', 'FakeNoun');
      expect(hasPermission).toBe(false);
    });

    it('Should grant every permission to the superadmin', async () => {
      const adminApp = await ctx.baseApp.asRole('admin');
      const ability = await getAbilityForUser(ctx.store.models, adminApp.user);
      const hasPermission = ability.can('fakeVerb', 'FakeNoun');
      expect(hasPermission).toBe(true);
    });
  });

  describe('Updating permissions', () => {
    const addNewPermission = async (method = p => ctx.store.models.Permission.create(p)) => {
      const { Patient } = ctx.store.models;
      const patient = await Patient.create(fake(Patient));
      await method({
        roleId: 'writer',
        noun: 'Patient',
        verb: 'write',
        objectId: patient.id,
      });
    };

    it('should reset the permission cache on a single update', async () => {
      // Arrange
      await addNewPermission();
      await getPermissionsForRoles(ctx.store.models, 'writer');
      expect(permissionCache.isEmpty()).toBe(false);

      // Act
      await addNewPermission();

      // Assert
      expect(permissionCache.isEmpty()).toBe(true);
    });

    it('should reset the permission cache on a bulk update', async () => {
      // Arrange
      const { Permission } = ctx.store.models;
      await addNewPermission();
      await getPermissionsForRoles(ctx.store.models, 'writer');
      expect(permissionCache.isEmpty()).toBe(false);

      // Act
      await addNewPermission(p => Permission.bulkCreate([p]));

      // Assert
      expect(permissionCache.isEmpty()).toBe(true);
    });
  });
});
