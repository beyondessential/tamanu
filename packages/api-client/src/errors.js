import { VERSION_COMPATIBILITY_ERRORS } from '@tamanu/constants';

export class ServerResponseError extends Error {}
export class AuthExpiredError extends ServerResponseError {}
export class VersionIncompatibleError extends ServerResponseError {}
export class ServerUnavailableError extends Error {}

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
