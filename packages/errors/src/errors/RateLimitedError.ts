import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../constants';

export class RateLimitedError extends BaseError {
  constructor(retryAfterSec: number, detail?: string) {
    super(ERROR_TYPE.RATE_LIMITED, 'Rate limited', 429, detail);
    this.extraData = {
      'retry-after': retryAfterSec,
    };
  }
}
