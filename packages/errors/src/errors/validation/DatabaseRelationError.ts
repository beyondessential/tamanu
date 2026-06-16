import { BaseValidationError } from '../ValidationError.ts';
import { ERROR_TYPE } from '../../constants.ts';

export class DatabaseRelationError extends BaseValidationError {
  constructor(detail?: string) {
    super(ERROR_TYPE.VALIDATION_RELATION, 'Database relation violation', detail);
  }
}
