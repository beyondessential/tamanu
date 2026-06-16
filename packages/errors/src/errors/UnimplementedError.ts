import { BaseError } from '../BaseError.ts';
import { ERROR_TYPE } from '../constants.ts';

export class UnimplementedError extends BaseError {
  constructor(detail?: string, status?: number) {
    super(ERROR_TYPE.UNIMPLEMENTED, 'Unimplemented', status ?? 501, detail);
  }
}
