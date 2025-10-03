import { convertDatabaseError } from '@tamanu/database';
import { errorHandlerProblem } from '@tamanu/shared/utils';

export default function errorHandler(error, req, res, next) {
  // see https://expressjs.com/en/guide/error-handling.html#the-default-error-handler
  if (res.headersSent) {
    next(error);
    return;
  }

  const { problem, json } = errorHandlerProblem(error, req, { convertDatabaseError });

  // we're past the point of permission checking; this just
  // makes sure the error send doesn't get intercepted by the
  // permissions middleware
  if (req.flagPermissionChecked) {
    req.flagPermissionChecked();
  }

  res.set(problem.headers);
  res.status(problem.status).send(json);
}
