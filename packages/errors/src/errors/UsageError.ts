import { BaseError } from '../BaseError.ts';
import { ERROR_TYPE } from '../constants.ts';

export class UsageError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION, 'Dev Usage Error', 500, detail);
  }
}
