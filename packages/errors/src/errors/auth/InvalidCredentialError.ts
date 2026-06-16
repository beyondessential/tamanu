import { BaseAuthenticationError } from '../AuthenticationError.ts';
import { ERROR_TYPE } from '../../constants.ts';

export class InvalidCredentialError extends BaseAuthenticationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.AUTH_CREDENTIAL_INVALID, 'Invalid credentials', detail);
  }
}
