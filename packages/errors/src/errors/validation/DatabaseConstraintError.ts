import { BaseValidationError } from '../ValidationError.ts';
import { ERROR_TYPE } from '../../constants.ts';

export class DatabaseConstraintError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_CONSTRAINT, 'Database constraint violation', detail);
  }
}
