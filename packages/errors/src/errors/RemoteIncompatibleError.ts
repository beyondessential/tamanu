import { ERROR_TYPE } from '../constants';
import { BaseRemoteError } from './RemoteError';

export class RemoteIncompatibleError extends BaseRemoteError {
  constructor(detail?: string) {
    super(ERROR_TYPE.REMOTE_INCOMPATIBLE, 'Remote version is incompatible', detail);
  }
}
