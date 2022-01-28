import { Permission } from 'shared/models/Permission';
import { buildAbilityForTests } from 'shared/permissions/buildAbility';
import { createTestContext } from '../utilities';

async function getPermissionsForRoles(sequelize, roleIds) {
  const result = await sequelize.query(`
    SELECT * 
      FROM permissions
      WHERE permissions.role_id IN (:roleIds)
  `, {
    model: Permission,
    mapToModel: true,
    replacements: {
      roleIds,
    },
  });

  return result.map(r => r.forResponse());
}

async function getAbilityForRoles(sequelize, roleIds) {
  const perms = await getPermissionsForRoles(sequelize, roleIds);
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
      { verb: 'write', noun: 'Patient' },
      { verb: 'read', noun: 'Report', objectId: "report-allowed" },
    ].map(p => ctx.store.models.Permission.create({
      roleId: 'reader',
      ...p,
    })));
  });

  describe('creating permission definition from database', () => {
    it('should read a permission definition object from a series of records', async () => {
      const ability = await getAbilityForRoles(ctx.store.sequelize, ["reader"]);
      expect(ability.can('read', { type: "Patient" }));
      expect(ability.can('write', { type: "Patient" }));
      expect(ability.can('run', { type: "Report", id: "report-allowed" }));
      expect(ability.cannot('run', { type: "Report", id: "report-forbidden" }));
    });
  });


});
