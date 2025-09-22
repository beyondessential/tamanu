import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../constants';

export class ForbiddenError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.FORBIDDEN, 'Forbidden', 403, detail);
  }
}
