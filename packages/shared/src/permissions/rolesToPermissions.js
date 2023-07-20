import config from 'config';
import { buildAbility, buildAbilityForUser } from './buildAbility';
import { permissionCache } from './cache';

//---------------------------------------------------------
// "Hardcoded" permissions version -- safe to delete once all deployments
// have been migrated to database version.
import * as roles from '../roles'; // eslint-disable-line import/order

function getHardcodedPermissions(roleIds) {
  const permissions = roles[roleIds];
  if (!permissions) {
    throw new Error(`Invalid role: ${roleIds}`);
  }
  return permissions;
}
//---------------------------------------------------------

const commaSplit = s =>
  s
    .split(',')
    .map(x => x.trim())
    .filter(x => x);

export async function queryPermissionsForRoles({ Permission }, roleString) {
  const roleIds = commaSplit(roleString);
  const result = await Permission.sequelize.query(
    `
    SELECT * 
      FROM permissions
      WHERE permissions.role_id IN (:roleIds)
  `,
    {
      model: Permission,
      mapToModel: true,
      replacements: {
        roleIds,
      },
    },
  );
  return result.map(r => r.forResponse());
}

// these functions allow testing permissions in isolation
// they should ONLY be used in tests
let { useHardcodedPermissions = false } = config?.auth;
export function setHardcodedPermissionsUseForTestsOnly(val) {
  useHardcodedPermissions = Boolean(val);
  permissionCache.reset();
}
export function unsetUseHardcodedPermissionsUseForTestsOnly() {
  useHardcodedPermissions = config.auth.useHardcodedPermissions;
  permissionCache.reset();
}

export async function getPermissionsForRoles(models, roleString) {
  if (useHardcodedPermissions) {
    return getHardcodedPermissions(roleString);
  }

  const cached = permissionCache.get(roleString);
  if (cached) {
    return cached;
  }

  // don't await this -- we want to store the promise, not the result
  // so that quick consecutive requests can benefit from it
  const permissions = queryPermissionsForRoles(models, roleString);

  permissionCache.set(roleString, permissions);
  return permissions;
}

export async function getAbilityForUser(models, user) {
  if (!user) {
    return buildAbility([]);
  }

  const permissions = await getPermissionsForRoles(models, user.role);
  const ability = buildAbilityForUser(user, permissions);

  return ability;
}
