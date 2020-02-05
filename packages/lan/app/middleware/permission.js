import { ForbiddenError, BadAuthenticationError } from 'lan/app/errors';
import { AbilityBuilder } from '@casl/ability';

export function constructPermission(req, res, next) {
  const user = req.user;

  if(!user) {
    req.ability = AbilityBuilder.define((allow, forbid) => {
      // no permissions
    });
    next();
    return;
  }

  // TODO: need to design which permissions go where
  req.ability = AbilityBuilder.define((allow, forbid) => {
    allow('read', 'all');
    allow('list', 'all');

    allow('create', 'Patient');
    allow('write', 'Patient');

    allow('create', 'Visit');
    allow('write', 'Visit');

    allow('create', 'Vitals');

    if (user.role === 'admin') {
      allow('create', 'User');
      allow('write', 'User');
    } else {
      allow('write', 'User', { id: user.id });
    }

  });

  next();
}

const checkPermission = (req, action, subject) => {
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

  const hasPermission = ability.can(action, subject);
  if (!hasPermission) {
    // user is logged in fine, they're just not allowed - 403
    throw new ForbiddenError(action);
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
