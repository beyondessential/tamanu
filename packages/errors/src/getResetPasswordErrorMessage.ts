import { ERROR_TYPE } from './constants';
import { BaseError } from './BaseError';
import { Problem } from './Problem';

export function getResetPasswordErrorMessage(error: Problem | BaseError): string {
  if (error instanceof BaseError) {
    return error.message;
  }

  if (error.type === ERROR_TYPE.RATE_LIMITED) {
    return `User locked out. ${Math.ceil(
      error.extra.get('retry-after') / 60,
    )} minute(s) remaining.`;
  }
  return error.message;
}
