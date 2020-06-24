import { log } from '../logging';

function getCodeForErrorName(name) {
  switch (name) {
    case 'BadAuthenticationError':
      return 401;
    case 'ForbiddenError':
      return 403;
    case 'NotFoundError':
      return 404;
    case 'InappropriateEndpointError':
      // method not allowed - usually for PUTting an endpoint that expects POST
      // but it's the closest status code we have without getting in to redirects
      return 405;
    case 'SequelizeUniqueConstraintError':
    case 'SequelizeValidationError':
    case 'SequelizeForeignKeyConstraintError':
    case 'InvalidOperationError':
    case 'InvalidParameterError':
      // unprocessable entity - syntax is correct but data is bad
      return 422;
    default:
      // error isn't otherwise caught - this is a problem with the server
      return 500;
  }
}

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
