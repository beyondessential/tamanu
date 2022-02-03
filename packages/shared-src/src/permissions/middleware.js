import config from 'config';
import { ForbiddenError, BadAuthenticationError } from 'shared/errors';
import { getAbilityForUser } from 'shared/permissions/rolesToPermissions';

//---------------------------------------------------------
// "Hardcoded" permissions version -- safe to delete once all deployments
// have been migrated to database version.
import { AbilityBuilder, Ability } from '@casl/ability';
import * as roles from 'shared/roles';

function constructPermissionsFromHardcode(user) {
  const { can, cannot, build } = new AbilityBuilder(Ability);

  if (!user) {
    return build(); // no permissions
  }

  const builder = roles[user.role];
  if (!builder) {
    throw new Error(`Invalide role: ${user.role}`);
  }
  builder(user, can, cannot);
  return build();
}
//----------------------------------------------------------


// copied from casl source as it's not exported directly
// (we could use casl's ForbiddenError.throwUnlessCan function except there's some
// strange error going on where the export appears to strip properties assigned via
// Object.defineProperty - probably straightforward enough to find a workaround, but
// we only need this one function out of it so it's not worth it.
function getSubjectName(subject) {
  if (!subject || typeof subject === 'string') {
    return subject;
  }

  const Type = typeof subject === 'object' ? subject.constructor : subject;

  return Type.modelName || Type.name;
}


export async function constructPermission(req, res, next) {
  const user = req.user;

  if (config.auth.useHardcodedPermissions) {
    req.ability = constructPermissionsFromHardcode(user);
  } else {
    req.ability = await getAbilityForUser(user);
  }

  next();
}

const checkPermission = (req, action, subject, field = '') => {
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
    // user must log in - 401
    throw new BadAuthenticationError();
  }

  const hasPermission = ability.can(action, subject, field);
  if (!hasPermission) {
    // user is logged in fine, they're just not allowed - 403
    const rule = ability.relevantRuleFor(action, subject, field);
    const reason =
      (rule && rule.reason) || `Cannot perform action "${action}" on ${getSubjectName(subject)}.`;
    throw new ForbiddenError(reason);
  }
};

// this middleware goes at the top of the middleware stack
export function ensurePermissionCheck(req, res, next) {
  const originalResSend = res.send;

  req.checkPermission = (action, subject) => {
    checkPermission(req, action, subject);
  };

  req.flagPermissionChecked = () => {
    res.send = originalResSend;
  };

  res.send = () => {
    res.send = originalResSend;
    res.status(501).send({
      error: {
        name: 'NoPermissionCheckError',
        message: 'No permission check was implemented for this endpoint.',
      },
    });
  };

  next();
}
