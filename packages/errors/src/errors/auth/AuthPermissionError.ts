import { BaseAuthenticationError } from '../AuthenticationError';
import { ERROR_TYPE } from '../../constants';

export class AuthPermissionError extends BaseAuthenticationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.AUTH_PERMISSION_REQUIRED, 'Lacks permission to authenticate', detail);
    this.status = 401;
  }
}
