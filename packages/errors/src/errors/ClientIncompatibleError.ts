import { BaseError } from '../BaseError.ts';
import { ERROR_TYPE } from '../constants.ts';

export class ClientIncompatibleError extends BaseError {
  constructor(detail?: string) {
    super(ERROR_TYPE.CLIENT_INCOMPATIBLE, 'Client version is incompatible', 400, detail);
  }
}
