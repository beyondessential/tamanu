import { BaseError } from '../BaseError.ts';
import { ERROR_TYPE } from '../constants.ts';

export class UnknownError extends BaseError {
  constructor(detail?: string, status?: number) {
    super(ERROR_TYPE.UNKNOWN, 'Unknown error', status ?? 500, detail);
  }
}
