import { BaseValidationError } from '../ValidationError.ts';
import { ERROR_TYPE } from '../../constants.ts';

export class InvalidParameterError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_PARAMETER, 'Invalid parameter', detail);
  }
}
