import { ERROR_TYPE } from '../constants.ts';
import { BaseRemoteError } from './RemoteError.ts';

export class RemoteUnreachableError extends BaseRemoteError {
  constructor(detail?: string) {
    super(ERROR_TYPE.REMOTE_UNREACHABLE, 'Remote unreachable', detail);
    if (detail?.includes('timeout')) {
      this.status = 504;
    }
  }
}
