import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../constants';

export class UsageError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION, 'Dev Usage Error', 500, detail);
  }
}
