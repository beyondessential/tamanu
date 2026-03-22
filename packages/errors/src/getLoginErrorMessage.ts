import { ERROR_TYPE } from './constants';
import { BaseError } from './BaseError';
import { Problem } from './Problem';

export function getLoginErrorMessage(error: Problem | BaseError): string {
  if (error instanceof BaseError) {
    return error.message;
  }
  let message = error.message;
  if (error.type === ERROR_TYPE.RATE_LIMITED) {
    message = `You have been locked out due to too many log in attempts. Please try again in ${Math.ceil(
      error.extra.get('retry-after') / 60,
    )} minute(s).`;
  } else if (error.type === ERROR_TYPE.AUTH_CREDENTIAL_INVALID && error.extra.has('lockout-attempts')) {
    const attemptsLeft = error.extra.get('lockout-attempts');
    const lockoutDuration = Math.ceil((error.extra.get('lockout-duration') ?? 0) / 60);
    const lockoutWarning = lockoutDuration > 0 ? ` before you are locked out for ${lockoutDuration} minute(s)` : '';
    message = `${error.title}, please try again.\n\nYou have ${attemptsLeft} more log in attempt(s)${lockoutWarning}.`;
  }
  return message;
}
