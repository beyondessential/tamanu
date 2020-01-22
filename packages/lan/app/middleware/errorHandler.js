import { log } from '../logging';

function getCodeForErrorName(name) {
  switch (name) {
    case 'BadAuthenticationError':
      return 401;
    case 'ForbiddenError':
      return 403;
    case 'NotFoundError':
      return 404;
    case 'SequelizeUniqueConstraintError':
    case 'SequelizeValidationError':
      // unprocessable entity - syntax is correct but data is bad
      return 422;
    default:
      // error isn't otherwise caught - this is a problem with the server
      return 500;
  }
}

export default function errorHandler(error, req, res, _) {
  const code = getCodeForErrorName(error.name);
  if (code >= 500) {
    log.error(`Error ${code}`, error);
  } else {
    log.info(`Error ${code}`, error);
  }
  res.status(code).send({ error });
}
