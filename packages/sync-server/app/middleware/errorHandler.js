import { getCodeForErrorName } from 'shared/errors';
import { log } from '../logging';

// eslint-disable-next-line no-unused-vars
export default function errorHandler(error, req, res, _) {
  const code = getCodeForErrorName(error.name);
  if (code >= 500) {
    log.error(`Error ${code}`, error);
  } else {
    log.info(`Error ${code}`, error);
  }

  res.status(code).send({
    error: {
      message: error.message,
      ...error,
    },
  });
}
