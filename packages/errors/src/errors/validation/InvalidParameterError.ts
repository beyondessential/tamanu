import { BaseValidationError } from '../ValidationError';
import { ERROR_TYPE } from '../../constants';

export class InvalidParameterError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_PARAMETER, 'Invalid parameter', detail);
  }
}
