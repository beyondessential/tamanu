import { BaseValidationError } from '../ValidationError.ts';
import { ERROR_TYPE } from '../../constants.ts';

export class DatabaseDuplicateError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_DUPLICATE, 'Duplicate resource', detail);
  }
}
