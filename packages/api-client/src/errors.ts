import { VERSION_COMPATIBILITY_ERRORS } from '@tamanu/shared/constants';

import { ResponseError } from './fetch';

export class ServerUnavailableError extends Error {}
export class ServerResponseError extends Error {}
export class AuthExpiredError extends ServerResponseError {}
export class VersionIncompatibleError extends ServerResponseError {}

export function getVersionIncompatibleMessage(
  error: ResponseError,
  response: Response,
): string | null {
  if (error.message === VERSION_COMPATIBILITY_ERRORS.LOW) {
    const minAppVersion = response.headers.get('X-Min-Client-Version');
    return `Please upgrade to Tamanu Desktop v${minAppVersion} or higher. Try closing and reopening, or contact your system administrator.`;
  }

  if (error.message === VERSION_COMPATIBILITY_ERRORS.HIGH) {
    const maxAppVersion = response.headers.get('X-Max-Client-Version');
    return `The Tamanu LAN Server only supports up to v${maxAppVersion}, and needs to be upgraded. Please contact your system administrator.`;
  }

  return null;
}
