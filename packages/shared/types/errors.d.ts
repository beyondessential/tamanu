declare module '@tamanu/shared/errors' {
  class BaseError extends Error {
    constructor(message: string);
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
  export function getCodeForErrorName(
    name: string,
  ): 400 | 401 | 403 | 404 | 405 | 422 | 502 | 504 | 503 | 507 | 500;
}
