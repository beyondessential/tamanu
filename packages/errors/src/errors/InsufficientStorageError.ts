import { BaseError } from '../BaseError.ts';
import { ERROR_TYPE } from '../constants.ts';

export class InsufficientStorageError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.STORAGE_INSUFFICIENT, 'Insufficient storage', 507, detail);
  }
}
