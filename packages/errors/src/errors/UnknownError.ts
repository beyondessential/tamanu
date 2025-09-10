import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../constants';

export class UnknownError extends BaseError {
  constructor(detail?: string, status?: number) {
    super(ERROR_TYPE.UNKNOWN, 'Unknown error', status ?? 500, detail);
  }
}
