import { BaseError } from '../../BaseError';
import { ERROR_TYPE } from '../../constants';

export class DatabaseDuplicateError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_DUPLICATE, 'Duplicate resource', 409, detail);
  }
}
