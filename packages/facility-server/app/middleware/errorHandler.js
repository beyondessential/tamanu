import config from 'config';
import { BaseError as SequelizeError } from 'sequelize';
import { convertDatabaseError } from '@tamanu/database';
import { Problem } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';

// eslint-disable-next-line no-unused-vars
export default function errorHandler(error, req, res, _) {
  if (error instanceof SequelizeError) {
    error = convertDatabaseError(error);
  }

  const exposeSensitive =
    process.env.NODE_ENV !== 'production' ||
    (config.debugging.apiErrorsToken &&
      req.get('tamanu-debug') === config.debugging.apiErrorsToken);
  const problem = (
    error instanceof Problem ? error : Problem.fromError(error)
  ).excludeSensitiveFields(!exposeSensitive);

  if (problem.type.includes('auth')) {
    log.warn(`Error ${problem.status} (${problem.type}): ${error.message}`);
  } else if (problem.status >= 500) {
    log.error(`Error ${problem.status} (${problem.type}): `, error);
  } else {
    log.info(`Error ${problem.status} (${problem.type}): `, error);
  }

  // we're past the point of permission checking; this just
  // makes sure the error send doesn't get intercepted by the
  // permissions middleware
  if (req.flagPermissionChecked) {
    req.flagPermissionChecked();
  }

  res.set(problem.headers);
  res.status(problem.status).send({
    ...problem.toJSON(),
    error: {
      message: error.message,
      ...error,
    },
  });
}
