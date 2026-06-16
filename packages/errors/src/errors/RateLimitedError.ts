import { BaseError } from '../BaseError.ts';
import { ERROR_TYPE } from '../constants.ts';

export class RateLimitedError extends BaseError {
  constructor(retryAfterSec: number, detail?: string) {
    super(ERROR_TYPE.RATE_LIMITED, 'Rate limited', 429, detail);
    this.extraData = {
      'retry-after': retryAfterSec,
    };
  }
}
