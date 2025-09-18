import { BaseAuthenticationError } from '../AuthenticationError';
import { ERROR_TYPE } from '../../constants';

export class QuotaExceededError extends BaseAuthenticationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.AUTH_QUOTA_EXCEEDED, 'Device registration quota exceeded', detail);
    this.status = 401;
  }
}
