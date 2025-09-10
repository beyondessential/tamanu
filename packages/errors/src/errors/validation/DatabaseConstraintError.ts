import { BaseValidationError } from '../ValidationError';
import { ERROR_TYPE } from '../../constants';

export class DatabaseConstraintError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_CONSTRAINT, 'Database constraint violation', detail);
  }
}
