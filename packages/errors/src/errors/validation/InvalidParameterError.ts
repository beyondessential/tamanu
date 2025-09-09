import { BaseValidationError } from '../ValidationError';
import { ERROR_TYPE } from '../../types';

export class InvalidParameterError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_PARAMETER, 'Invalid parameter', detail);
  }
}
