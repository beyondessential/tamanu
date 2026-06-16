import { BaseError } from '../BaseError.ts';
import { ERROR_TYPE, type ErrorType } from '../constants.ts';

/** Do not construct outside of the errors package, use only for instanceof checks. */
export class BaseAuthenticationError extends BaseError {
  constructor(type: ErrorType, title: string, detail?: string) {
    super(type, title, 401, detail);
  }
}

/** Generic authentication error. Prefer the more specific types. */
export class BadAuthenticationError extends BaseAuthenticationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.AUTH, 'Bad Authentication', detail);
  }
}
