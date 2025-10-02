import { convertDatabaseError } from '@tamanu/database';
import { errorHandlerProblem } from '@tamanu/shared/utils';

// eslint-disable-next-line no-unused-vars
export const buildErrorHandler = getResponse => (error, req, res, next) => {
  // see https://expressjs.com/en/guide/error-handling.html#the-default-error-handler
  if (res.headersSent) {
    next(error);
    return;
  }

  const { problem, json } = errorHandlerProblem(error, req, { convertDatabaseError });

  res.set(problem.headers);
  res.status(problem.status).send(getResponse(error, json));
};

export const defaultErrorHandler = buildErrorHandler((_error, defaultJson) => defaultJson);
