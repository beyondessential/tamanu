import { getCodeForErrorName } from '@tamanu/shared/errors';
import { log } from '@tamanu/shared/services/logging';

// eslint-disable-next-line no-unused-vars
export default function errorHandler(error, req, res, _) {
  const code = getCodeForErrorName(error.name);
  if (error.name === 'BadAuthenticationError') {
    log.warn(`Error ${code}: ${error.message}`);
  } else if (code >= 500) {
    log.error(`Error ${code}: `, error);
  } else {
    log.info(`Error ${code}: `, error);
  }

  // we're past the point of permission checking; this just
  // makes sure the error send doesn't get intercepted by the
  // permissions middleware
  req.flagPermissionChecked();

  res.status(code).send({
    error: {
      message: error.message,
      ...error,
    },
  });
}
