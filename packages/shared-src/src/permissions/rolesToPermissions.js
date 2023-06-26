import config from 'config';
import { isEmpty } from 'lodash';
import { buildAbility, buildAbilityForUser } from './buildAbility';
import { Permission } from '../models';

//---------------------------------------------------------
// "Hardcoded" permissions version -- safe to delete once all deployments
// have been migrated to database version.
import * as roles from 'shared/roles'; // eslint-disable-line import/order

function getHardcodedPermissions(roleIds) {
  const permissions = roles[roleIds];
  if (!permissions) {
    throw new Error(`Invalid role: ${roleIds}`);
  }
  return permissions;
}
//---------------------------------------------------------

let permissionCache = {};

export function resetPermissionCache() {
  permissionCache = {};
}

// helper for testing
export function isPermissionCacheEmpty() {
  return isEmpty(permissionCache);
}

const commaSplit = s =>
  s
    .split(',')
    .map(x => x.trim())
    .filter(x => x);

export async function queryPermissionsForRoles(roleString) {
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
let { useHardcodedPermissions } = config.auth;
export function setHardcodedPermissionsUseForTestsOnly(val) {
  useHardcodedPermissions = Boolean(val);
  resetPermissionCache();
}
export function unsetUseHardcodedPermissionsUseForTestsOnly() {
  useHardcodedPermissions = config.auth.useHardcodedPermissions;
  resetPermissionCache();
}

export async function getPermissionsForRoles(roleString) {
  if (useHardcodedPermissions) {
    return getHardcodedPermissions(roleString);
  }

  const cached = permissionCache[roleString];
  if (cached) {
    return cached;
  }

  // don't await this -- we want to store the promise, not the result
  // so that quick consecutive requests can benefit from it
  const permissions = queryPermissionsForRoles(roleString);

  permissionCache[roleString] = permissions;
  return permissions;
}

export async function getAbilityForUser(user) {
  if (!user) {
    return buildAbility([]);
  }

  const permissions = await getPermissionsForRoles(user.role);
  const ability = buildAbilityForUser(user, permissions);

  return ability;
}
