import { buildAbilityForTests } from '@tamanu/shared/permissions/buildAbility';
import {
  getAbilityForUser,
  queryPermissionsForRoles,
} from '@tamanu/shared/permissions/rolesToPermissions';
import { createTestContext } from '../utilities';
import { makeRoleWithPermissions } from '../permissions';

async function getAbilityForRoles(models, roleString) {
  const perms = await queryPermissionsForRoles(models, roleString);
  return buildAbilityForTests(perms);
}

describe('Permissions', () => {
  let ctx;

  beforeAll(async () => {
    ctx = await createTestContext();

    await Promise.all([
      makeRoleWithPermissions(ctx.store.models, 'reader', [
        { verb: 'read', noun: 'Patient' },
        { verb: 'run', noun: 'Report', objectId: 'report-allowed' },
        {
          verb: 'run',
          noun: 'Report',
          objectId: 'report-allowed-but-revoked',
          deletedAt: new Date(),
        },
      ]),
      makeRoleWithPermissions(ctx.store.models, 'writer', [{ verb: 'write', noun: 'Patient' }]),
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
    ).resolves.not.toThrow();
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

      await makeRoleWithPermissions(ctx.store.models, 'practitioner', [
        { verb: 'write', noun: 'EncounterDiagnosis' },
      ]);
    });

    it('should send the list of permissions for a user', async () => {
      const userApp = await ctx.baseApp.asRole('practitioner');
      const response = await userApp.get('/api/permissions');
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
});
