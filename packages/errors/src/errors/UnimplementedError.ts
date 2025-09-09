import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../types';

export class UnimplementedError extends BaseError {
  constructor(detail?: string, status?: number) {
    super(ERROR_TYPE.UNIMPLEMENTED, 'Unimplemented', status ?? 501, detail);
  }
}
