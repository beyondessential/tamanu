import { timingSafeEqual } from 'node:crypto';
import config from 'config';
import { BaseError as SequelizeError } from 'sequelize';
import { ERROR_TYPE, Problem } from '@tamanu/errors';
import { log } from '../services/logging';

export function errorHandlerProblem(error, req, { convertDatabaseError }) {
  if (error instanceof SequelizeError) {
    error = convertDatabaseError(error);
  }

  const exposeSensitive =
    process.env.NODE_ENV !== 'production' ||
    (typeof config.debugging.apiErrorsToken === 'string' &&
      config.debugging.apiErrorsToken.length > 0 &&
      timingSafeEqual(
        Buffer.from(req.get('tamanu-debug') ?? ''),
        Buffer.from(config.debugging.apiErrorsToken ?? ''),
      ));
  const problem = (
    error instanceof Problem ? error : Problem.fromError(error)
  ).excludeSensitiveFields(!exposeSensitive);

  if (problem.type.includes(ERROR_TYPE.AUTH)) {
    log.warn(`Error ${problem.status} (${problem.type}): ${error.message}`);
  } else if (problem.status >= 500) {
    log.error(`Error ${problem.status} (${problem.type}): `, error);
  } else {
    log.info(`Error ${problem.status} (${problem.type}): `, error);
  }

  return {
    problem,
    json: {
      // RFC 7807 Problem Details for HTTP APIs
      ...problem.toJSON(),

      // legacy error format
      error: {
        message: error.message,
        name: error.name,
        status: problem.status,
      },
    },
  };
}
