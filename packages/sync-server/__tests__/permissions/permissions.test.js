import { buildAbilityForTests } from 'shared/permissions/buildAbility';
import { queryPermissionsForRoles } from 'shared/permissions/rolesToPermissions';
import { createTestContext } from '../utilities';

import config from 'config';

async function getAbilityForRoles(roleString) {
  const perms = await queryPermissionsForRoles(roleString);
  return buildAbilityForTests(perms);
}

describe('Permissions', () => {
  let ctx;
  
  const makeRoleWithPermissions = async (roleName, perms) => {
    const role = await ctx.store.models.Role.create({ id: roleName, name: roleName });
    await Promise.all(perms.map(p => ctx.store.models.Permission.create({
      roleId: role.id,
      ...p,
    })));
  };

  beforeAll(async () => {
    ctx = await createTestContext();

    await Promise.all([
      makeRoleWithPermissions('reader', [
        { verb: 'read', noun: 'Patient' },
        { verb: 'run', noun: 'Report', objectId: "report-allowed" },
      ]),
      makeRoleWithPermissions('writer', [
        { verb: 'write', noun: 'Patient' },
      ]),
    ]);

  });

  afterAll(() => ctx.close());

  describe('Creating permission definition from database', () => {
    it('should read a permission definition object from a series of records', async () => {
      const ability = await getAbilityForRoles("reader");
      expect(ability.can('read', { type: "Patient" }));
      expect(ability.cannot('write', { type: "Patient" }));
      expect(ability.can('run', { type: "Report", id: "report-allowed" }));
      expect(ability.cannot('run', { type: "Report", id: "report-forbidden" }));
    });

    it('should read a permission definition object across multiple roles', async () => {
      const ability = await getAbilityForRoles("reader, writer");
      expect(ability.can('read', { type: "Patient" }));
      expect(ability.can('write', { type: "Patient" }));
      expect(ability.can('run', { type: "Report", id: "report-allowed" }));
      expect(ability.cannot('run', { type: "Report", id: "report-forbidden" }));
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
  });

});
