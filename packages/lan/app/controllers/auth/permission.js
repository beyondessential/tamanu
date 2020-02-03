import { ForbiddenError, BadAuthenticationError } from 'lan/app/errors';

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
