import { BaseAuthenticationError } from '../AuthenticationError';
import { ERROR_TYPE } from '../../types';

export class InvalidTokenError extends BaseAuthenticationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.AUTH_TOKEN_INVALID, 'Invalid token', detail);
  }
}
