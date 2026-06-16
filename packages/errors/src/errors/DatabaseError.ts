import { BaseError } from '../BaseError.ts';
import { ERROR_TYPE } from '../constants.ts';

/**
 * Generic database error. Also consider the more specific `DatabaseConstraintError`,
 * `DatabaseDuplicateError`, `DatabaseRelationError`, `DatabaseValidationError`,
 * `NotFoundError`.
 */
export class DatabaseError extends BaseError {
  constructor(detail?: string, status?: number) {
    super(ERROR_TYPE.DATABASE, 'Database', status ?? 500, detail);
  }
}
