import { ERROR_TYPE } from './constants.ts';
import { BaseError } from './BaseError.ts';
import { type Problem } from './Problem.ts';

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
