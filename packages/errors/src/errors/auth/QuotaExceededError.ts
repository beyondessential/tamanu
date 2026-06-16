import { BaseAuthenticationError } from '../AuthenticationError.ts';
import { ERROR_TYPE } from '../../constants.ts';

export class QuotaExceededError extends BaseAuthenticationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.AUTH_QUOTA_EXCEEDED, 'Device registration quota exceeded', detail);
    this.status = 401;
  }
}
