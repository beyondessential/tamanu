import { ERROR_TYPE } from '../constants.ts';
import { BaseRemoteError } from './RemoteError.ts';

export class RemoteIncompatibleError extends BaseRemoteError {
  constructor(detail?: string) {
    super(ERROR_TYPE.REMOTE_INCOMPATIBLE, 'Remote version is incompatible', detail);
  }
}
