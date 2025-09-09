import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../types';

export class ForbiddenError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.FORBIDDEN, 'Forbidden', 403, detail);
  }
}
