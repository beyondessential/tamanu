import { BaseError } from '../BaseError';
import { ERROR_TYPE, type ErrorType } from '../constants';

/** Do not construct outside of the errors package, use only for instanceof checks. */
export class BaseValidationError extends BaseError {
  constructor(type: ErrorType, title: string, detail?: string) {
    super(type, title, 422, detail);
  }
}

/** Generic validation error. Prefer the more specific types. */
export class ValidationError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION, 'Validation', detail);
  }
}
