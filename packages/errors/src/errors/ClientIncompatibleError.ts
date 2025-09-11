import { BaseError } from '../BaseError';
import { ERROR_TYPE } from '../constants';

export class ClientIncompatibleError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.CLIENT_INCOMPATIBLE, 'Client version is incompatible', 400, detail);
  }
}
