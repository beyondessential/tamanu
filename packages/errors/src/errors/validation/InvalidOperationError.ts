import { BaseValidationError } from '../ValidationError.ts';
import { ERROR_TYPE } from '../../constants.ts';

export class InvalidOperationError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_OPERATION, 'Invalid operation', detail);
  }
}
