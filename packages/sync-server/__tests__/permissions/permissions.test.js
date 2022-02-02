import { buildAbilityForTests } from 'shared/permissions/buildAbility';
import { getPermissionsForRoles } from 'shared/permissions/rolesToPermissions';
import { createTestContext } from '../utilities';

async function getAbilityForRoles(roleString) {
  const perms = await getPermissionsForRoles(roleString);
  return buildAbilityForTests(perms);
}

describe('Permissions', () => {
  let ctx;
  beforeAll(async () => {
    ctx = await createTestContext();

    await Promise.all([
      "reader",
      "writer",
    ].map(r => ctx.store.models.Role.create({
      id: r,
      name: r
    })));

    await Promise.all([
      { verb: 'read', noun: 'Patient' },
      { verb: 'run', noun: 'Report', objectId: "report-allowed" },
    ].map(p => ctx.store.models.Permission.create({
      roleId: 'reader',
      ...p,
    })));

    await Promise.all([
      { verb: 'write', noun: 'Patient' },
    ].map(p => ctx.store.models.Permission.create({
      roleId: 'writer',
      ...p,
    })));
  });

  describe('creating permission definition from database', () => {
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

});
