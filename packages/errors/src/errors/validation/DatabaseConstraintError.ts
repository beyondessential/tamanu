import { BaseValidationError } from '../ValidationError';
import { ERROR_TYPE } from '../../types';

export class DatabaseConstraintError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_CONSTRAINT, 'Database constraint violation', detail);
  }
}
