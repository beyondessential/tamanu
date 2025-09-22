import { BaseError } from '../BaseError';
import { ERROR_TYPE, type ErrorType } from '../constants';

/** Do not construct outside of the errors package, use only for instanceof checks. */
export class BaseRemoteError extends BaseError {
  constructor(type: ErrorType, title: string, detail?: string) {
    super(type, title, 502, detail);
  }
}

/** Generic remote error. Prefer the more specific types. */
export class RemoteCallError extends BaseRemoteError {
  constructor(detail?: string) {
    super(ERROR_TYPE.REMOTE, 'Remote call failed', detail);
  }
}
