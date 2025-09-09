import { BaseAuthenticationError } from '../AuthenticationError';
import { ERROR_TYPE } from '../../types';

export class InvalidCredentialError extends BaseAuthenticationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.AUTH_CREDENTIAL_INVALID, 'Invalid credentials', detail);
  }
}
