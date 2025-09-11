import { BaseValidationError } from '../ValidationError';
import { ERROR_TYPE } from '../../constants';

export class DatabaseRelationError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_RELATION, 'Database relation violation', detail);
  }
}
