import { VERSION_COMPATIBILITY_ERRORS } from '@tamanu/constants';

export class ServerUnavailableError extends Error {}
export class ServerResponseError extends Error {
  constructor(message, response) {
    super(message);
    this.response = response;
  }
}
export class NotFoundError extends ServerResponseError {}
export class AuthError extends ServerResponseError {}
export class AuthInvalidError extends AuthError {}
export class AuthExpiredError extends AuthError {}
export class ForbiddenError extends AuthError {}
export class VersionIncompatibleError extends ServerResponseError {}
export class ResourceConflictError extends ServerResponseError {}

export function isRecoverable(error) {
  if (error instanceof ServerUnavailableError) {
    return true;
  }

  if (!(error instanceof ServerResponseError)) {
    return false;
  }

  if (error instanceof AuthInvalidError || error instanceof VersionIncompatibleError) {
    return false;
  }

  if (error.response.status >= 400 && error.response.status < 500) {
    return false;
  }

  if (error.message.includes('Insufficient') && error.message.toLowerCase().includes('storage')) {
    return false;
  }

  if (error.message.includes('Sync session')) {
    return false;
  }

  return true;
}

export function getVersionIncompatibleMessage(error, response) {
  if (error.message === VERSION_COMPATIBILITY_ERRORS.LOW) {
    return 'Tamanu is out of date, reload to get the new version! If that does not work, contact your system administrator.';
  }

  if (error.message === VERSION_COMPATIBILITY_ERRORS.HIGH) {
    const maxAppVersion = response.headers
      .get('X-Max-Client-Version')
      .split('.', 3)
      .slice(0, 2)
      .join('.');
    return `The Tamanu Facility Server only supports up to v${maxAppVersion}, and needs to be upgraded. Please contact your system administrator.`;
  }

  return null;
}
