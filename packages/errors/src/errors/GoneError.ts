import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../constants';

export class GoneError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.GONE, 'Gone', 410, detail);
  }
}
