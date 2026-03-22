import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../constants';

export class NotFoundError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.NOT_FOUND, 'Not found', 404, detail);
  }
}
