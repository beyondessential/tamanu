import { BaseValidationError } from '../ValidationError';
import { ERROR_TYPE } from '../../constants';

export class DatabaseDuplicateError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_DUPLICATE, 'Duplicate resource', detail);
  }
}
