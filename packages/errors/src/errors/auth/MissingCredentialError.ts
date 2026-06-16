import { BaseAuthenticationError } from '../AuthenticationError.ts';
import { ERROR_TYPE } from '../../constants.ts';

export class MissingCredentialError extends BaseAuthenticationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.AUTH_CREDENTIAL_MISSING, 'Missing credentials', detail);
    this.status = 400;
  }
}
