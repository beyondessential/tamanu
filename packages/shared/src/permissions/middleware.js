import { ForbiddenError, BadAuthenticationError } from '../errors';
import { getAbilityForUser, getPermissionsForRoles } from './rolesToPermissions';

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
  try {
    req.ability = await getAbilityForUser(req.models, req.user);
    next();
  } catch (e) {
    next(e);
  }
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
    throw new BadAuthenticationError('No permission');
  }

  const subjectName = getSubjectName(subject);
  const hasPermission = ability.can(action, subject, field);

  if (req.audit) {
    req.audit.addPermissionCheck(action, subjectName, subject?.id);
  }

  if (!hasPermission) {
    // user is logged in fine, they're just not allowed - 403
    const rule = ability.relevantRuleFor(action, subject, field);
    const reason = (rule && rule.reason) || `Cannot perform action "${action}" on ${subjectName}.`;

    if (req.audit) {
      req.audit.annotate({
        forbiddenReason: reason,
      });
    }

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

// eslint-disable-next-line no-unused-vars
export async function getPermissions(req, res, _next) {
  const { user, models } = req;

  const permissions = await getPermissionsForRoles(models, user.role);
  res.send({
    permissions,
  });
}
