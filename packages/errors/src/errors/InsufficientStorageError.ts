import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../constants';

export class InsufficientStorageError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.STORAGE_INSUFFICIENT, 'Insufficient storage', 507, detail);
  }
}
