import { BaseValidationError } from '../ValidationError';
import { ERROR_TYPE } from '../../types';

export class DatabaseValidationError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_DATABASE, 'Database model validation', detail);
  }
}
