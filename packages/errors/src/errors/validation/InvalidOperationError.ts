import { BaseValidationError } from '../ValidationError';
import { ERROR_TYPE } from '../../types';

export class InvalidOperationError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_OPERATION, 'Invalid operation', detail);
  }
}
