import { BaseAuthenticationError } from '../AuthenticationError';
import { ERROR_TYPE } from '../../constants';

export class MissingCredentialError extends BaseAuthenticationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.AUTH_CREDENTIAL_MISSING, 'Missing credentials', detail);
    this.status = 400;
  }
}
