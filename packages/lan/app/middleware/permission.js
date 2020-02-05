import { ForbiddenError, BadAuthenticationError } from 'lan/app/errors';
import { AbilityBuilder } from '@casl/ability';

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

export function constructPermission(req, res, next) {
  const user = req.user;

  if (!user) {
    req.ability = AbilityBuilder.define((allow, forbid) => {
      // no permissions
    });
    next();
    return;
  }

  // TODO: need to design which permissions go where
  req.ability = AbilityBuilder.define((allow, forbid) => {
    allow('read', 'User');
    allow('write', 'User', { id: user.id });

    allow('list', 'ReferenceData');
    allow('read', 'ReferenceData');

    allow('read', 'Patient');
    allow('create', 'Patient');
    allow('write', 'Patient');

    allow('read', 'Visit');
    allow('create', 'Visit');
    allow('write', 'Visit');

    allow('read', 'Vitals');
    allow('create', 'Vitals');

    if (user.role === 'admin') {
      allow('create', 'User');
      allow('write', 'User');

      allow('write', 'ReferenceData');
      allow('create', 'ReferenceData');
    }
  });

  next();
}

const checkPermission = (req, action, subject, field = '') => {
  if (!req.flagPermissionChecked) {
    return;
  }

  req.flagPermissionChecked();

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
    const reason = (rule && rule.reason) || `Cannot perform action "${action}" on ${getSubjectName(subject)}.`;
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
