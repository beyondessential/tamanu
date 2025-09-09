import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../types';

export class EditConflictError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.EDIT_CONFLICT, 'Edit conflict', 409, detail);
  }
}
