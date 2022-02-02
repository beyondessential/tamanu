import { buildAbility } from './buildAbility';
import { Permission } from '../models';

let permissionCache = {};

export function resetPermissionCache() {
  permissionCache = {};
}

const commaSplit = s => s.split(",").map(x => x.trim()).filter(x => x);

async function queryPermissionsForRoles(roleIds) {
  const result = await Permission.sequelize.query(`
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

export async function getPermissionsForRoles(roleString) {
  const cached = permissionCache[roleString];
  if (cached) {
    return cached;
  }

  const roleIds = commaSplit(roleString);
  const permissions = await queryPermissionsForRoles(roleIds);

  permissionCache[roleString] = permissions;
  return permissions;
}

export async function getAbilityForUser(user) {
  if (!user) {
    return buildAbility([]);
  }

  const permissions = await getPermissionsForRoles(user.role);
  const ability = buildAbility([
    ...permissions,
    // a user can always read and write themselves -- this is 
    // separate to the role system as it's cached per-role, not per-user
    { verb: 'read', noun: 'User', objectId: user.id },
    { verb: 'write', noun: 'User', objectId: user.id },
  ]);
  return ability;
}
