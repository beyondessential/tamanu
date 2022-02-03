import { buildAbility } from './buildAbility';
import { Permission } from '../models';
import config from 'config';

//---------------------------------------------------------
// "Hardcoded" permissions version -- safe to delete once all deployments
// have been migrated to database version.
import * as roles from 'shared/roles';

function getHardcodedPermissions(roleIds) {
  return roles[roleIds];
}
//---------------------------------------------------------

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
  if (config.auth.useHardcodedPermissions) {
    return getHardcodedPermissions(roleString);
  }

  const cached = permissionCache[roleString];
  if (cached) {
    return cached;
  }

  const roleIds = commaSplit(roleString);

  // don't await this -- we want to store the promise, not the result
  // so that quick consecutive requests can benefit from it
  const permissions = queryPermissionsForRoles(roleIds);

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
