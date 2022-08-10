class BaseError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class NotFoundError extends BaseError {}
export class BadAuthenticationError extends BaseError {}
export class ForbiddenError extends BaseError {}
export class InvalidOperationError extends BaseError {}
export class InvalidParameterError extends BaseError {}
export class InappropriateEndpointError extends BaseError {}
export class RemoteTimeoutError extends BaseError {}
export class RemoteCallFailedError extends BaseError {}
export class RequestQueueTimeoutError extends BaseError {}
export class RequestQueueExceededError extends BaseError {}
export class InsufficientStorageError extends BaseError {}
export class InvalidClientHeadersError extends BaseError {}
export class InvalidConfigError extends BaseError {}
export class FacilityAndSyncVersionIncompatibleError extends BaseError {}

export function getCodeForErrorName(name) {
  switch (name) {
    case 'InvalidClientHeadersError':
      return 400;
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
    case 'ValidationError':
      // unprocessable entity - syntax is correct but data is bad
      return 422;
    case 'RemoteCallFailedError':
    case 'FacilityAndSyncVersionIncompatibleError':
      // remote server returned an error
      return 502;
    case 'RemoteTimeoutError':
      // remote server timed out
      return 504;
    case 'RequestQueueTimeoutError':
    case 'RequestQueueExceededError':
      // load shedder kicked in
      return 503;
    case 'InsufficientStorageError':
      return 507;
    default:
      // error isn't otherwise caught - this is a problem with the server
      return 500;
  }
}
