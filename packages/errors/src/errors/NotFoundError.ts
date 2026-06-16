import { BaseError } from '../BaseError.ts';
import { ERROR_TYPE } from '../constants.ts';

export class NotFoundError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.NOT_FOUND, 'Not found', 404, detail);
  }
}
