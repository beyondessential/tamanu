import { AuthPermissionError, ForbiddenError, UnimplementedError } from '@tamanu/errors';
import { getAbilityForUser, getPermissionsForRoles } from './rolesToPermissions';

// copied from casl source as it's not exported directly
// (we could use casl's ForbiddenError.throwUnlessCan function except there's some
// strange error going on where the export appears to strip properties assigned via
// Object.defineProperty - probably straightforward enough to find a workaround, but
// we only need this one function out of it so it's not worth it.
export function getSubjectName(subject) {
  if (!subject || typeof subject === 'string') {
    return subject;
  }

  const Type = typeof subject === 'object' ? subject.constructor : subject;

  return Type.modelName || Type.name;
}

async function validateImpersonateRole(req) {
  const raw = req.get('X-Impersonate-Role');
  if (!raw || !req.user || req.user.role !== 'admin') return undefined;

  const roleId = raw.trim();
  if (!roleId || roleId.includes(',')) {
    throw new ForbiddenError('Invalid impersonation role ID');
  }

  const role = await req.models.Role.findByPk(roleId);
  if (!role) {
    throw new ForbiddenError('Impersonation role does not exist');
  }

  return roleId;
}

export async function constructPermission(req, res, next) {
  try {
    const impersonateRoleId = await validateImpersonateRole(req);
    // eslint-disable-next-line require-atomic-updates
    req.ability = await getAbilityForUser(req.models, req.user, { impersonateRoleId });
    req.impersonatingRole = impersonateRoleId; // eslint-disable-line require-atomic-updates
    next();
  } catch (e) {
    next(e);
  }
}

const checkIfHasPermission = (req, action, subject, field = '') => {
  if (req.flagPermissionChecked) {
    req.flagPermissionChecked();
  }

  // allow a null permission to let things through - this means all endpoints
  // still need an explicit permission check, even if it's a null one!
  if (!action) {
    return;
  }

  const { ability } = req;
  if (!ability) {
    throw new AuthPermissionError(`${action} ${subject}`);
  }

  return ability.can(action, subject, field);
};

// this middleware goes at the top of the middleware stack
export function ensurePermissionCheck(req, res, next) {
  const originalResSend = res.send;

  req.checkPermission = (action, subject) => {
    const hasPermission = checkIfHasPermission(req, action, subject);
    if (!hasPermission) {
      const rule = req.ability.relevantRuleFor(action, subject);
      const reason =
        (rule && rule.reason) ||
        `No permission to perform action "${action}" on "${getSubjectName(subject)}"`;
      throw new ForbiddenError(reason);
    }
  };

  req.checkForOneOfPermissions = (actions, subject) => {
    const permissionChecks = actions.map((action) => checkIfHasPermission(req, action, subject));
    const hasPermission = permissionChecks.some(Boolean);
    if (!hasPermission) {
      const reason = `No permission to perform any of actions "${actions.join(', ')}" on "${getSubjectName(subject)}"`;
      throw new ForbiddenError(reason);
    }
  };

  req.checkListOrReadPermission = (subject) => {
    req.checkForOneOfPermissions(['list', 'read'], subject);
  };

  req.flagPermissionChecked = () => {
    res.send = originalResSend;
  };

  res.send = () => {
    res.send = originalResSend;
    throw new UnimplementedError('No permission check was implemented for this endpoint.');
  };

  next();
}

// eslint-disable-next-line no-unused-vars
export async function getPermissions(req, res, _next) {
  const { user, models } = req;
  req.flagPermissionChecked();

  const impersonateRoleId = await validateImpersonateRole(req);
  const roleString = impersonateRoleId || user.role;

  const permissions = await getPermissionsForRoles(models, roleString);
  res.send({
    permissions,
  });
}
