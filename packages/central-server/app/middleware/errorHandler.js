import config from 'config';
import { BaseError as SequelizeError } from 'sequelize';
import { convertDatabaseError } from '@tamanu/database';
import { Problem } from '@tamanu/errors';
import { log } from '@tamanu/shared/services/logging';

// eslint-disable-next-line no-unused-vars
export const buildErrorHandler = getResponse => (error, req, res, next) => {
  // see https://expressjs.com/en/guide/error-handling.html#the-default-error-handler
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof SequelizeError) {
    error = convertDatabaseError(error);
  }

  const problem = (
    error instanceof Problem ? error : Problem.fromError(error)
  ).excludeSensitiveFields(
    process.env.NODE_ENV === 'production' &&
      req.get('tamanu-debug') === config.debugging.apiErrorsToken,
  );

  if (problem.status >= 500) {
    log.error(`Error ${problem.status} (${problem.type}): `, error);
  } else {
    log.info(`Error ${problem.status} (${problem.type}): `, error);
  }

  res.set(problem.headers);
  res.status(problem.status).send(getResponse(error, problem.toJSON()));
};

export const defaultErrorHandler = buildErrorHandler((error, problem) => ({
  // RFC 7807 Problem Details for HTTP APIs
  ...problem,

  // legacy error format
  error: {
    message: error.message,
    name: error.name,
    status: problem.status,
  },
}));
