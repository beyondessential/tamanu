import { BaseAuthenticationError } from '../AuthenticationError.ts';
import { ERROR_TYPE } from '../../constants.ts';

export class InvalidTokenError extends BaseAuthenticationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.AUTH_TOKEN_INVALID, 'Invalid token', detail);
  }
}
