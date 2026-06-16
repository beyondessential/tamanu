import { BaseError } from '../BaseError.ts';
import { ERROR_TYPE } from '../constants.ts';

export class EditConflictError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.EDIT_CONFLICT, 'Edit conflict', 409, detail);
  }
}
