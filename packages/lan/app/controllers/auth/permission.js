import { ForbiddenError, BadAuthenticationError } from 'Lan/app/errors';

// this middleware goes at the top of the middleware stack
export function ensurePermissionCheck(req, res, next) {
  res.hasCheckedPermission = false;

  const originalResSend = res.send;
  res.send = (...args) => {
    res.send = originalResSend;
    if(!res.hasCheckedPermission) {
      res.status(501).send({
        error: {
          name: "NoPermissionCheckError",
          message: "No permission check was implemented for this endpoint.",
        }
      });
      return;
    }
    res.send(...args);
  }
  next();
}

// this middleware should be used as part of each endpoint, for eg
//  router.get('/sensitive/info', checkPermission('accessSensitiveInfo'), (req, res) => { ... });
// or
//  router.get('/public/info', checkPermission(null), (req, res) => { ... });
export const checkPermission = permission => async (req, res, next) => {
  res.hasCheckedPermission = true;

  // allow a null permission to let things through - this means all endpoints
  // still need an explicit permission check, even if it's a null one!
  if(!permission) {
    next();
    return;
  }

  const { user } = req;
  if(!user) {
    // user must log in - 401
    next(new BadAuthenticationError());
    return;
  }

  const hasPermission = await user.hasPermission(permission);
  if(!hasPermission) {
    // user is logged in fine, they're just not allowed - 403
    next(new ForbiddenError(permission));
    return;
  }

  next();
};
