import { getCodeForErrorName } from 'shared/errors';
import { log } from 'shared/services/logging';

// eslint-disable-next-line no-unused-vars
export default function errorHandler(error, req, res, _) {
  const code = getCodeForErrorName(error.name);
  if (code >= 500) {
    log.error(`Error ${code}`, error);
  } else {
    log.info(`Error ${code}`, error);
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
