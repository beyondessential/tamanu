import { getCodeForErrorName } from '@tamanu/shared/errors';
import { log } from '@tamanu/shared/services/logging';

// eslint-disable-next-line no-unused-vars
export const buildErrorHandler = getResponse => (error, req, res, next) => {
  const code = getCodeForErrorName(error.name);
  if (code >= 500) {
    log.error(`Error ${code}: `, error);
  } else {
    log.info(`Error ${code}: `, error);
  }

  // see https://expressjs.com/en/guide/error-handling.html#the-default-error-handler
  if (res.headersSent) {
    next(error);
    return;
  }

  res.status(code).send(getResponse(error));
};

export const defaultErrorHandler = buildErrorHandler(error => ({
  error: {
    message: error.message,
    ...error,
  },
}));
