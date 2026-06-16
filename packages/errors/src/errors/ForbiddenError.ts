import { BaseError } from '../BaseError.ts';
import { ERROR_TYPE } from '../constants.ts';

export class ForbiddenError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.FORBIDDEN, 'Forbidden', 403, detail);
  }
}
