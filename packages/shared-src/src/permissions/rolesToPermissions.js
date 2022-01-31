import { buildAbility } from './buildAbility';
import { Permission } from '../models';

let permissionCache = {};

export function resetPermissionCache() {
  // to run after permissions get imported
  // TODO: add this to Role::update / Role::create?
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

export function getAbilityForUser(user) {
  const permissions = getPermissionsForRoles(user.role);
  const ability = buildAbility(permissions);
  return ability;
}
